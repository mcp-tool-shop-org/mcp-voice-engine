import { ProsodyPresetV1 } from "../../../voice-engine-core/src/prosody/ProsodyV1.js";

/**
 * Validates and clamps a Prosody configuration to safe operating ranges.
 * This prevents configurations that might cause severe audio artifacts
 * (like rapid switching/warble due to 0 hysteresis or extreme sensitivity).
 * 
 * @param config The configuration to validate
 * @returns A new configuration object with clamped values
 */
export function validateAndClampConfig(config: ProsodyPresetV1): ProsodyPresetV1 {
    const clamped = { ...config }; // Shallow copy is enough for top-level, but we need deep for nested
    
    // Deep copy specific sections we modify
    if (config.stabilizer) {
        clamped.stabilizer = { ...config.stabilizer };
    }
    if (config.analysis) {
        clamped.analysis = { ...config.analysis };
    }

    // Ensure min hysteresisCents >= 5
    // Hysteresis < 5 cents can cause rapid oscillation between pitch classes (warble)
    if (clamped.stabilizer) {
        const currentHysteresis = clamped.stabilizer.hysteresisCents ?? 15;
        if (currentHysteresis < 5) {
            clamped.stabilizer.hysteresisCents = 5;
        }
    }

    // Ensure voicingThresholdQ is reasonable
    // Range: 0 to 10000. 
    // < 100 implies almost everything is voiced (noise artifacts).
    // > 9000 implies almost nothing is voiced.
    if (clamped.analysis) {
        let thresh = clamped.analysis.voicingThresholdQ;
        if (thresh === undefined) {
             // Default if missing
             thresh = 2000;
        }
        
        // Clamp to [100, 9000]
        clamped.analysis.voicingThresholdQ = Math.max(100, Math.min(9000, thresh));
    }

    return clamped;
}

/**
 * Applies an expressiveness scale factor to the configuration.
 * 
 * @param config The base configuration
 * @param amount Amount of expressiveness (0.0 to 1.0). 
 *               0.0 = Robotic / Strict (Full Correction)
 *               1.0 = Expressive / Natural (Zero Correction or reduced strength)
 * @returns Modified configuration
 */
export function applyExpressiveness(config: ProsodyPresetV1, amount: number): ProsodyPresetV1 {
    const modified = { ...config };
    
    // Clamp amount 0..1
    const safeAmount = Math.max(0, Math.min(1, amount));
    
    // Interpretation: "Expressiveness" reduces the correction strength.
    // Base strength is scaled down by the expressiveness amount.
    // If amount is 0 (No Expressiveness), we keep full strength.
    // If amount is 1 (Full Expressiveness), we reduce strength to 0.
    
    const baseStrength = config.correctionStrength ?? 1.0;
    modified.correctionStrength = baseStrength * (1.0 - safeAmount);

    return modified;
}
