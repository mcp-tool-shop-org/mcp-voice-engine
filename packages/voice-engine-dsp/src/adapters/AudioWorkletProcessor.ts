import { StreamingAutotuneEngine } from '../tuning/StreamingAutotuneEngine';

/**
 * AutotuneProcessor
 * 
 * This class implements the processing logic for an AudioWorkletProcessor.
 * It does not extend AudioWorkletProcessor directly to avoid issues in non-browser environments (like Node.js tests),
 * but it matches the interface required by the Web Audio API.
 * 
 * Usage in a real AudioWorklet:
 * 1. Bundle this file and its dependencies (e.g. using Vite, Webpack, or Rollup).
 * 2. In your worklet entry file:
 * 
 *    import { AutotuneProcessor } from './AutotuneProcessor';
 * 
 *    class RealAutotuneProcessor extends AudioWorkletProcessor {
 *        constructor(options) {
 *            super();
 *            this.impl = new AutotuneProcessor(options, this.port);
 *        }
 *        process(inputs, outputs, parameters) {
 *            return this.impl.process(inputs, outputs, parameters);
 *        }
 *    }
 *    registerProcessor('autotune-processor', RealAutotuneProcessor);
 */
export class AutotuneProcessor {
    private engine: StreamingAutotuneEngine;
    private port: MessagePort | null;

    constructor(options: any, port?: MessagePort) {
        const config = options.processorOptions?.config || {};
        const preset = options.processorOptions?.preset || {};
        
        this.engine = new StreamingAutotuneEngine(config, preset);
        this.port = port || null;

        if (this.port) {
            this.port.onmessage = (event: MessageEvent) => {
                const { type, data } = event.data;
                if (type === 'enqueueEvents') {
                    this.engine.enqueueEvents(data);
                } else if (type === 'updateConfig') {
                     // potentially update config
                }
            };
        }
    }

    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
        // inputs[inputIndex][channelIndex]
        const input = inputs[0];
        const output = outputs[0];

        // If no input or empty implementation, return true to keep alive
        if (!input || input.length === 0) return true;

        const inputChannel0 = input[0];
        const outputChannel0 = output[0];

        // Process Mono (Channel 0)
        // Note: StreamingAutotuneEngine expects a Float32Array block.
        // AudioWorklet usually provides 128 frames.
        if (inputChannel0 && outputChannel0) {
            // Check if input size matches block size or create sub-blocks?
            // Usually AudioWorklet input is fixed size (128).
            // StreamingAutotuneEngine handles any size block (it iterates internally).
            const result = this.engine.process(inputChannel0);
            outputChannel0.set(result.audio);

            // Copy to other channels if output has more than one
            for (let c = 1; c < output.length; c++) {
                if (output[c]) {
                    output[c].set(result.audio);
                }
            }
        }

        return true;
    }
}
