import { Transform, TransformCallback, TransformOptions } from 'stream';
import { StreamingAutotuneEngine } from '../tuning/StreamingAutotuneEngine';

export interface NodeStreamAutotuneOptions extends TransformOptions {
    engine: StreamingAutotuneEngine;
    blockSize?: number;
}

/**
 * A Node.js Transform stream wrapper for StreamingAutotuneEngine.
 * Handles buffering of incoming audio chunks to match the engine's required block size.
 * Assumes input is Float32Array (object mode) or Buffer (raw float32 LE bytes).
 */
export class NodeStreamAutotune extends Transform {
    private engine: StreamingAutotuneEngine;
    private blockSize: number;
    private _buffer: Float32Array;
    private _bufferedSamples: number;

    constructor(options: NodeStreamAutotuneOptions) {
        // Enforce objectMode if not specified, as we want to output Float32Array by default
        // or Buffer if the downstream expects it.
        // For now, let's stick to standard Buffer input/output if not in objectMode.
        super(options);

        this.engine = options.engine;
        this.blockSize = options.blockSize || 128; // Default block size
        this._buffer = new Float32Array(this.blockSize * 2); // Start with double capacity
        this._bufferedSamples = 0;
    }

    /**
     * Delegate method to enqueue control events to the engine.
     * @param events Array of control events (notes, params, etc.)
     */
    public enqueueEvents(events: any[]): void {
        this.engine.enqueueEvents(events);
    }

    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback): void {
        let inputFloats: Float32Array;

        // 1. Convert chunk to Float32Array
        if (Buffer.isBuffer(chunk)) {
            // Assume raw float32 LE bytes
            const numSamples = chunk.length / 4;
            inputFloats = new Float32Array(chunk.buffer, chunk.byteOffset, numSamples);
        } else if (chunk instanceof Float32Array) {
            inputFloats = chunk;
        } else {
             return callback(new Error('NodeStreamAutotune expects Buffer or Float32Array chunks.'));
        }

        // 2. Append to internal buffer
        this._appendToBuffer(inputFloats);

        // 3. Process as many blocks as possible
        this._processBufferedData();

        callback();
    }

    _flush(callback: TransformCallback): void {
        // Build remaining samples
        // If there are leftover samples, we could pad with zeros or just process them?
        // The engine might expect full blocks (128).
        // Let's pad with silence to complete the last block if necessary.
        if (this._bufferedSamples > 0) {
            const needed = this.blockSize - this._bufferedSamples;
            if (needed > 0) {
               const padding = new Float32Array(needed).fill(0);
               this._appendToBuffer(padding);
            }
            this._processBufferedData();
        }
        callback();
    }

    private _appendToBuffer(newData: Float32Array): void {
        const requiredCapacity = this._bufferedSamples + newData.length;
        if (requiredCapacity > this._buffer.length) {
            // Resize buffer
            const newCapacity = Math.max(requiredCapacity, this._buffer.length * 2);
            const newBuffer = new Float32Array(newCapacity);
            newBuffer.set(this._buffer.subarray(0, this._bufferedSamples));
            this._buffer = newBuffer;
        }
        this._buffer.set(newData, this._bufferedSamples);
        this._bufferedSamples += newData.length;
    }

    private _processBufferedData(): void {
        let offset = 0;

        while (this._bufferedSamples >= this.blockSize) {
            // Extract one block
            const block = this._buffer.subarray(offset, offset + this.blockSize);
            
            // Process (engine expects Float32Array of size blockSize usually)
            const result = this.engine.process(block);
            
            // Output
            if (this.writableObjectMode || this.readableObjectMode) {
                 this.push(result.audio); // Push Float32Array directly
            } else {
                 // Convert back to Buffer (raw bytes)
                 this.push(Buffer.from(result.audio.buffer, result.audio.byteOffset, result.audio.byteLength));
            }
            
            offset += this.blockSize;
            this._bufferedSamples -= this.blockSize;
        }

        // Shift remaining data to start of buffer
        if (this._bufferedSamples > 0 && offset > 0) {
            this._buffer.copyWithin(0, offset, offset + this._bufferedSamples);
        }
    }
}
