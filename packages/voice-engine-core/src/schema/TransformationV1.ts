/**
 * Schemas for audio transformation and pitch shifting operations.
 */

export interface PitchShiftRequestV1 {
    mode: "autotune.v1";
    /** Artifact ID for the input audio */
    audioRef: string;
    /** Artifact ID for the F0 track */
    f0Ref: string;
    /** Artifact ID for the Voicing mask */
    voicingRef: string;
    /** Artifact ID for the Target Pitch Curve */
    targetRef: string;
    /** Artifact ID for the Correction Envelope */
    envelopeRef: string;
    
    formantMode: "preserve" | "none" | "placeholder";
    quality: "fast" | "balanced" | "high";
    /** Global wet mix ceiling (0..10000) */
    strengthMixQ: number;
    unvoicedPolicy: "bypass" | "hold_last" | "zero";
}

export interface TuningExecutionMetaV1 {
    windowSamples: number;
    hopSamples: number;
    latencySamples: number;
    clampedFramesCount: number;
}

export interface RenderedAudioV1 {
    /** Artifact ID of the resulting audio */
    audioRef: string;
    /** Metadata about the execution */
    meta: TuningExecutionMetaV1;
}
