import { AudioBufferV1 } from "./SynthesisV1";
import { AnalysisPitchRequestV1, AnalysisVoicingRequestV1 } from "./AnalysisV1";
import { PitchShiftRequestV1 } from "./TransformationV1";

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

export interface DspPitchShiftActionV1 {
    type: "pitch_shift";
    request: PitchShiftRequestV1;
}

export type DspRequestV1 = 
    | AnalysisPitchRequestV1 
    | AnalysisVoicingRequestV1 
    | DspAutotuneRequestV1 
    | DspConcatRequestV1
    | DspCrossfadeRequestV1
    | DspPitchShiftActionV1;

export interface DspResultV1 {
    audio: AudioBufferV1;
}
