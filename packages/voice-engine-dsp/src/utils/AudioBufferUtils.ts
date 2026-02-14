import { AudioBufferV1 } from "@mcptoolshop/voice-engine-core";

export function monoDownmix(buffer: AudioBufferV1): Float32Array {
    if (buffer.channels === 1) {
        return buffer.data[0];
    }

    const length = buffer.data[0].length;
    const output = new Float32Array(length);
    const channelCount = buffer.channels;

    for (let i = 0; i < length; i++) {
        let sum = 0;
        for (let ch = 0; ch < channelCount; ch++) {
            sum += buffer.data[ch][i];
        }
        output[i] = sum / channelCount;
    }

    return output;
}
