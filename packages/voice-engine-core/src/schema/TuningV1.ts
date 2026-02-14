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

    // --- Phase 6 Controls (Optional) ---
    /** Global correction mix (0..10000), default 10000 */
    globalStrengthQ?: number;
    /** Attack time in ms (0..1000), default 0 */
    attackMsQ?: number;
    /** Release time in ms (0..1000), default 0 */
    releaseMsQ?: number;
    /** Hysteresis window in cents (0..100), default 0 */
    hysteresisCentsQ?: number;
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

// Phase 5: Request & Plan Schemas

export type TuningPreset = "subtle" | "natural" | "pop" | "hard" | "robot";

export interface TuneRequestV1 {
    mode: "scale" | "notes";
    key?: string;   // e.g. "C", "F#"
    scale?: string; // e.g. "major", "minor", "chromatic"
    preset?: TuningPreset; // defaults to "natural"
    overrides?: {
        snapStrength?: number; // 0..100
        glideMs?: number;      // 0..inf
        retuneSpeed?: number;  // 0..100
        consonantProtection?: number; // 0..100
        
        // Phase 6
        globalStrength?: number; // 0..100
        attackMs?: number;       // 0..1000
        releaseMs?: number;      // 0..1000
        hysteresisCents?: number;// 0..100
    };
}

export interface TunePlanV1 {
    /** Resolved mode */
    mode: "scale" | "notes";
    
    /** Canonicalized Scale Config */
    scaleConfig: {
        key: string;
        scale: string;
        /** Pitch classes allowed (0=C, 1=C#, ..., 11=B) */
        allowedPitchClasses: number[];
        /** Reference pitch info (e.g. A4=440) if needed */
        referenceHz: number;
    };
    
    /** Explicit DSP parameters */
    parameters: {
        /** 0..10000 */
        snapStrengthQ: number;
        /** 0..10000 ms (or appropriate unit) */
        glideMsQ: number;
        /** 0..10000 */
        retuneSpeedQ: number;
        /** 0..10000 - reduction of correction on low confidence */
        consonantProtectionQ: number;

        // Phase 6
        globalStrengthQ: number;
        attackMsQ: number;
        releaseMsQ: number;
        hysteresisCentsQ: number;
    };

    /** System/Version info for determinism */
    meta: {
        resolverVersion: string;
        timestamp: number;
    };
}

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

