/**
 * Configuration and schemas for deterministic musical intent (Phase 3).
 */

export interface TuneScoreScaleConfigV1 {
    mode: "scale";
    key: string; // "C", "C#", "Db", etc.
    scale: "major" | "minor" | "chromatic";
    /** Snap strength (0..10000) */
    snapStrengthQ: number;
    /** Transition time in milliseconds (0..2000) */
    glideMsQ: number;
    /** Vibrato depth in cents (0..200) - Optional */
    vibratoDepthCentsQ?: number;
    /** Vibrato rate in Hz * 100 (0..1200) - Optional */
    vibratoRateHzQ?: number;
}

export interface TuneScoreNoteEventV1 {
    tSamples: number;
    durSamples: number;
    midi: number;
}

export interface TuneScoreNoteConfigV1 {
    mode: "notes";
    tempoBpmQ: number;
    notes: TuneScoreNoteEventV1[];
}

export type TuneScoreV1 = TuneScoreScaleConfigV1 | TuneScoreNoteConfigV1;

export interface TargetCurveV1 {
    sampleRateHz: number;
    frameHz: number;
    hopSamples: number;
    t0Samples: number;
    /** Target pitch in absolute cents * 10 (e.g., MIDI 69 = 6900 = 440Hz) */
    targetCentsQ: Int32Array;
}

export interface CorrectionEnvelopeV1 {
    sampleRateHz: number;
    frameHz: number;
    hopSamples: number;
    t0Samples: number;
    /** Correction strength (0..10000) */
    strengthQ: Int16Array;
    /** Optional glide strength override */
    glideStrengthQ?: Int16Array;
}

export interface TunePlanV1 {
    /** The configuration/score used to generate this plan */
    score: TuneScoreV1;
    /** The generated target pitch curve */
    targetCurve: TargetCurveV1;
    /** The generated correction strength envelope */
    correctionEnvelope: CorrectionEnvelopeV1;
    /** Map of module IDs used to generate this plan */
    moduleIds?: Record<string, string>;
}
