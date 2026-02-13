import { SynthesisRequestV1 } from "./SynthesisV1";
import { DspRequestV1 } from "./DspV1";

export interface RenderOutputOptionsV1 {
    mode: "stream" | "buffer" | "file";
    format: "wav" | "mp3" | "raw";
    sampleRate?: number;
    bitrate?: number;
}

export interface RenderSegmentV1 extends SynthesisRequestV1 {
    id: string;
}

export interface RenderPlanV1 {
    planVersion: "voiceengine.plan.v1";
    traceId: string;
    seed: number;
    synth: RenderSegmentV1[];
    post: DspRequestV1[];
    output: RenderOutputOptionsV1;
}
