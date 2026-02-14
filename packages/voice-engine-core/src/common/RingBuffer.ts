export class RingBuffer {
    private buffer: Float32Array;
    private capacity: number;
    private writeIndex: number = 0;
    private readIndex: number = 0;
    private _available: number = 0;

    constructor(capacity: number) {
        this.capacity = capacity;
        this.buffer = new Float32Array(capacity);
    }

    write(data: Float32Array): void {
        const len = data.length;
        for (let i = 0; i < len; i++) {
            this.buffer[this.writeIndex] = data[i];
            this.writeIndex = (this.writeIndex + 1) % this.capacity;
        }
        this._available = Math.min(this._available + len, this.capacity);
    }

    read(size: number): Float32Array {
        const output = new Float32Array(size);
        for (let i = 0; i < size; i++) {
             if (this._available > 0) {
                 output[i] = this.buffer[this.readIndex];
                 this.readIndex = (this.readIndex + 1) % this.capacity;
                 this._available--;
             } else {
                 output[i] = 0;
             }
        }
        return output;
    }
    
    available(): number {
        return this._available;
    }
    
    clear(): void {
        this.writeIndex = 0;
        this.readIndex = 0;
        this._available = 0;
    }
}
