import { F0TrackV1 } from "../schema/AnalysisV1.js";
import { F0DecompositionV1 } from "./ProsodyV1.js";

/**
 * Decomposes raw F0 tracks into Macro (Intonation) and Micro (Vibrato/Jitter) components.
 * Essential for natural-sounding autotune and prosody manipulation.
 */
export class F0Decomposer {
    
    /**
     * Decompose an F0 track.
     * @param track The raw F0 track (in mHz)
     * @param smoothWindowSize Size of the smoothing window in frames (odd number recommended). Default ~250ms if 100fps (25 frames).
     */
    decompose(track: F0TrackV1, smoothWindowSize: number = 25): F0DecompositionV1 {
        const len = track.f0MhzQ.length;
        const macroVals = new Float32Array(len);
        const microVals = new Float32Array(len);
        const residualVals = new Float32Array(len);

        // Convert mHz int32 to float Hz for processing
        const f0Hz = new Float32Array(len);
        for(let i=0; i<len; i++) {
            f0Hz[i] = track.f0MhzQ[i] / 1000.0;
        }

        // 1. Calculate Macro (Smoothed) Component
        // Using a Simple Moving Average (SMA) ignoring zeros (unvoiced).
        // This is a basic separation technique. 
        const half = Math.floor(smoothWindowSize / 2);

        for (let i = 0; i < len; i++) {
            if (f0Hz[i] <= 0) {
                // Unvoiced
                macroVals[i] = 0;
                continue;
            }

            let sum = 0;
            let count = 0;
            
            // Gather neighborhood
            for(let j = -half; j <= half; j++) {
                const queryIdx = i + j;
                if (queryIdx >= 0 && queryIdx < len) {
                    const val = f0Hz[queryIdx];
                    if (val > 0) {
                        sum += val;
                        count++;
                    }
                }
            }

            if (count > 0) {
                macroVals[i] = sum / count;
            } else {
                macroVals[i] = f0Hz[i]; // Fallback to self
            }
        }

        // 2. Calculate Micro Component (Residual)
        // Micro = Raw - Macro
        for (let i = 0; i < len; i++) {
            if (f0Hz[i] > 0 && macroVals[i] > 0) {
                microVals[i] = f0Hz[i] - macroVals[i];
            } else {
                microVals[i] = 0;
            }
        }

        return {
            macro: { frames: len, valuesHz: macroVals },
            micro: { frames: len, valuesHz: microVals },
            residual: { frames: len, valuesHz: residualVals }
        };
    }
}
