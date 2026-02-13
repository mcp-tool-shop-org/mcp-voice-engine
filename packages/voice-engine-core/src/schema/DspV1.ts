import { AudioBufferV1 } from "./SynthesisV1";

export interface DspAutotuneRequestV1 {
    type: "autotune";
    scale?: string;
    correction: number;
}

export interface DspConcatRequestV1 {
    type: "concat";
    gap?: number;
}

export interface DspCrossfadeRequestV1 {
    type: "crossfade";
    duration: number;
}

export type DspRequestV1 = 
    | DspAutotuneRequestV1 
    | DspConcatRequestV1 
    | DspCrossfadeRequestV1;

export interface DspResultV1 {
    audio: AudioBufferV1;
}
