/**
 * Interfaces for Prosody Analysis (Phase 7)
 */

export type ProsodySegmentKind = "voiced" | "unvoiced" | "silence";

export interface ProsodySegmentV1 {
    kind: ProsodySegmentKind;
    startFrame: number;
    endFrame: number;
    avgConfQ?: number; // 0..10000
    avgEnergyDb?: number; 
}

export interface ProsodyAnalysisConfigV1 {
    /** 
     * Minimum energy in dB for a frame to be considered "speech" (voiced or unvoiced).
     * e.g., -60 dB. Default: -60.
     */
    silenceThresholdDb?: number;
    
    /**
     * Minimum confidence for voicing (0..10000). 
     * e.g., 2000. Default: 2000.
     */
    voicingThresholdQ?: number;

    /** Frames needed to confirm voicing entry (debounce). Default: 2. */
    voicedEnterFrames?: number;

    /** Frames needed to confirm voicing exit (hangover). Default: 5. */
    voicedExitFrames?: number;

    // Phase 7.2 Decomposer Config
    /** Time constant for Center F0 smoothing in ms. Default: 30. */
    centerSmoothingMs?: number;
    /** Duration to fade residual in/out at edges in ms. Default: 20. */
    residualFadeMs?: number;
}

export interface ProsodyComponentV1 {
    frames: number;
    /**
     * Pitch values in Hz. 
     * For Macro: Absolute Pitch (e.g., 440.0)
     * For Micro: Relative Pitch Deviation (e.g., +2.5, -2.5)
     */
    valuesHz: Float32Array;
}

export interface TargetStabilizerConfigV1 {
    allowedPitchClasses?: number[];
    rootOffsetCents?: number;
    hysteresisCents?: number;
    minHoldMs?: number;
    transitionSlopeThreshCentsPerSec?: number;
    switchRampMs?: number;
}

export interface StabilizedTargetV1 {
    targetCents: Float32Array;
    noteIds: Int32Array;
    inTransition: Uint8Array;
}

export interface F0DecompositionV1 {
    /**
     * The slow-moving intonation curve (Phrase + Accent).
     * Represents the "intended" note or slide.
     */
    macro: ProsodyComponentV1;
    
    /**
     * The fast-moving texture (Vibrato, Jitter, Flutter).
     * Representative of voice quality and expression style.
     */
    micro: ProsodyComponentV1;

    /**
     * Unexplained variance or noise (optional/future use).
     */
    residual: ProsodyComponentV1;
}

export interface PhraseBaselineResultV1 {
    /** 
     * The modeled baseline curve (Hz) representing phrase declination.
     * For unvoiced regions, this may be 0 or interpolated.
     */
    baselineHz: Float32Array;

    /**
     * The "intent" or "melodic contour" derived by removing the baseline.
     * intent = macro - baseline.
     */
    intentHz: Float32Array;

    /**
     * Calculated slopes for each detected phrase (Hz/frame or Hz/sec).
     */
    slopes: number[];
}

export interface TuningConfigV1 {
    /** Root key ("C", "Db", "F#"). Default: "C". */
    key?: string; 
    /** Scale name ("major", "minor", "chromatic", "pentatonic_minor"). Default: "chromatic". */
    scale?: string; 
    /** Reference pitch in Hz. Default: 440. */
    referenceHz?: number; 
    /** Explicitly allowed MIDI pitch classes (0-11). Overrides key/scale if provided. */
    enabledPitchClasses?: number[]; 
}

export interface ProsodyPresetV1 {
    id: string;
    name: string;
    description: string;
    
    /** Analysis configuration (Segmentation, Decomposer, Baseline) */
    analysis: ProsodyAnalysisConfigV1;
    
    /** stabilizer configuration (Quantization, Hysteresis, Smoothing) */
    stabilizer: TargetStabilizerConfigV1;
    
    /** Tuning configuration (Key/Scale) - usually overridden by user */
    tuning: TuningConfigV1;
    
    /** Strength of pitch correction (0.0 - 1.0). Scales the correction envelope. Default: 1.0. */
    correctionStrength?: number;
    
    /** Attack time in ms. Default: 20ms. */
    attackMs?: number;
    
    /** Release time in ms. Default: 100ms. */
    releaseMs?: number;
}
