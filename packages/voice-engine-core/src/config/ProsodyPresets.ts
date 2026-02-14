import { 
    ProsodyAnalysisConfigV1, 
    TargetStabilizerConfigV1,
    ProsodyPresetV1,
    TuningConfigV1
} from '../prosody/ProsodyV1.js';

export type { ProsodyPresetV1 }; // Re-export for consumers


export const DEFAULT_PROSODY_CONFIG_V1: ProsodyAnalysisConfigV1 = {
    silenceThresholdDb: -60,
    voicingThresholdQ: 2000,
    voicedEnterFrames: 2,
    voicedExitFrames: 5,
    centerSmoothingMs: 30,
    residualFadeMs: 20
};

export const DEFAULT_STABILIZER_CONFIG_V1: TargetStabilizerConfigV1 = {
    allowedPitchClasses: undefined, // undefined Means override by tuning
    rootOffsetCents: 0,
    hysteresisCents: 15,
    minHoldMs: 60,
    transitionSlopeThreshCentsPerSec: 500,
    switchRampMs: 30
};

export const DEFAULT_TUNING_CONFIG_V1: TuningConfigV1 = {
    key: "C",
    scale: "chromatic",
    referenceHz: 440
};

const BASE_PRESET: ProsodyPresetV1 = {
    id: "base",
    name: "Base",
    description: "Base preset",
    analysis: { ...DEFAULT_PROSODY_CONFIG_V1 },
    stabilizer: { ...DEFAULT_STABILIZER_CONFIG_V1 },
    tuning: { ...DEFAULT_TUNING_CONFIG_V1 },
    correctionStrength: 1.0,
    attackMs: 20,
    releaseMs: 100
};

export const HARD_TUNE_PRESET: ProsodyPresetV1 = {
    ...BASE_PRESET,
    id: "hard-tune",
    name: "Hard Tune",
    description: "Aggressive, robotic pitch correction effect.",
    stabilizer: {
        ...DEFAULT_STABILIZER_CONFIG_V1,
        hysteresisCents: 25,
        minHoldMs: 100, // Longer hold to enforce notes
        switchRampMs: 10, // Fast switching
        transitionSlopeThreshCentsPerSec: 800 // Harder to glide
    },
    correctionStrength: 1.0,
    attackMs: 5,
    releaseMs: 50
};

export const NATURAL_PRESET: ProsodyPresetV1 = {
    ...BASE_PRESET,
    id: "natural",
    name: "Natural",
    description: "Transparent correction that preserves expression.",
    stabilizer: {
        ...DEFAULT_STABILIZER_CONFIG_V1,
        hysteresisCents: 15,
        minHoldMs: 80,
        switchRampMs: 40,
        transitionSlopeThreshCentsPerSec: 500
    },
    correctionStrength: 0.8,
    attackMs: 40,
    releaseMs: 150
};

export const SUBTLE_PRESET: ProsodyPresetV1 = {
    ...BASE_PRESET,
    id: "subtle",
    name: "Subtle",
    description: "Very gentle correction for slight pitch drift.",
    stabilizer: {
        ...DEFAULT_STABILIZER_CONFIG_V1,
        hysteresisCents: 10, // Allow more wavering
        minHoldMs: 60,
        switchRampMs: 80, // Slow ramps
        transitionSlopeThreshCentsPerSec: 400
    },
    correctionStrength: 0.4,
    attackMs: 80,
    releaseMs: 300
};

export function normalizePreset(preset: Partial<ProsodyPresetV1>): ProsodyPresetV1 {
    const base = { ...BASE_PRESET };
    
    // Merge provided config
    const merged: ProsodyPresetV1 = {
        ...base,
        ...preset,
        analysis: { ...base.analysis, ...(preset.analysis || {}) },
        stabilizer: { ...base.stabilizer, ...(preset.stabilizer || {}) },
        tuning: { ...base.tuning, ...(preset.tuning || {}) }
    };

    // Clamp values
    merged.correctionStrength = Math.max(0, Math.min(1, merged.correctionStrength ?? 1));
    merged.attackMs = Math.max(0, merged.attackMs ?? 20);
    merged.releaseMs = Math.max(0, merged.releaseMs ?? 100);
    
    merged.stabilizer.hysteresisCents = Math.max(0, merged.stabilizer.hysteresisCents ?? 15);
    merged.stabilizer.minHoldMs = Math.max(0, merged.stabilizer.minHoldMs ?? 60);
    
    return merged;
}
