export interface AudioBufferV1 {
    sampleRate: number;
    channels: number;
    format: "f32";
    data: Float32Array[];
}

export interface SynthesisRequestV1 {
    text: string;
    voice: string;
    speed?: number;
    format: "plain" | "ssml";
}

export interface AlignmentV1 {
    // Basic alignment structure, extending as needed in future
    words: {
        word: string;
        startTime: number;
        endTime: number;
    }[];
}

export interface SynthesisResultV1 {
    audio: AudioBufferV1;
    alignment?: AlignmentV1;
}
