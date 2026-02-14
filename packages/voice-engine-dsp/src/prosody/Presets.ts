import { ProsodyPresetV1, TargetStabilizerConfigV1, ProsodyAnalysisConfigV1 } from "../../../voice-engine-core/src/prosody/ProsodyV1.js";
import { DEFAULT_PROSODY_CONFIG_V1, DEFAULT_STABILIZER_CONFIG_V1, DEFAULT_TUNING_CONFIG_V1 } from "../../../voice-engine-core/src/config/ProsodyPresets.js";

function createPreset(
    id: string, 
    name: string, 
    desc: string, 
    overrides: Partial<ProsodyPresetV1> = {}
): ProsodyPresetV1 {
    return {
        id,
        name,
        description: desc,
        analysis: { ...DEFAULT_PROSODY_CONFIG_V1, ...(overrides.analysis || {}) },
        stabilizer: { ...DEFAULT_STABILIZER_CONFIG_V1, ...(overrides.stabilizer || {}) },
        tuning: { ...DEFAULT_TUNING_CONFIG_V1, ...(overrides.tuning || {}) },
        correctionStrength: overrides.correctionStrength ?? 1.0,
        attackMs: overrides.attackMs ?? 20,
        releaseMs: overrides.releaseMs ?? 100
    };
}

export const PRESETS: Record<string, ProsodyPresetV1> = {
    DEFAULT_CLEAN: createPreset(
        "default_clean",
        "Default Clean",
        "Balanced correction for clean speech",
        {
            stabilizer: {
                hysteresisCents: 15,
                switchRampMs: 30
            }
        } // Uses defaults mostly
    ),

    HARD_TUNE: createPreset(
        "hard_tune",
        "Hard Tune",
        "Zero hysteresis, fast ramp for maximum robotic effect",
        {
            stabilizer: {
                hysteresisCents: 0, // Note: SafetyRails may clamp this to 5
                switchRampMs: 5,    // Fast ramp
                minHoldMs: 10       // Short hold
            },
            correctionStrength: 1.0,
            attackMs: 5,
            releaseMs: 5
        }
    ),

    NO_WARBLE: createPreset(
        "no_warble",
        "No Warble",
        "High hysteresis and slow ramp to prevent artifacts",
        {
            stabilizer: {
                hysteresisCents: 25,
                switchRampMs: 100, // "Slow ramp" - interpreted as 100ms (approx 10 frames @ 100Hz)
                minHoldMs: 100
            },
            analysis: {
                voicingThresholdQ: 3000 // Conservative voicing (higher confidence required)
            }
        }
    ),

    SUBTLE: createPreset(
        "subtle",
        "Subtle",
        "Low correction strength for natural enhancement",
        {
            correctionStrength: 0.3
        }
    )
};
