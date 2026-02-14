import { ProsodySegmentV1, PhraseBaselineResultV1 } from './ProsodyV1';

export class PhraseBaselineModel {
    /**
     * Calculates the linear pitch declination baseline for each voiced phrase.
     * @param segments The segments identified by the ProsodySegmenter.
     * @param macroF0 The smoothed center F0 curve from the F0Decomposer.
     * @returns The baseline and the intent (macro - baseline).
     */
    public analyze(segments: ProsodySegmentV1[], macroF0: Float32Array): PhraseBaselineResultV1 {
        const frameCount = macroF0.length;
        const baselineHz = new Float32Array(frameCount);
        const intentHz = new Float32Array(frameCount);
        const slopes: number[] = [];

        for (const segment of segments) {
            // For unvoiced or silence, we don't calculate a baseline model.
            // We treat the "intent" as just the raw values (usually 0 or noise).
            if (segment.kind !== 'voiced') {
                for (let i = segment.startFrame; i < segment.endFrame; i++) {
                    intentHz[i] = macroF0[i];
                }
                // Determine if we should push a slope placeholder.
                // Since 'slopes' corresponds to segments, we should to keep indices aligned.
                slopes.push(0);
                continue;
            }

            const len = segment.endFrame - segment.startFrame;
            
            // If segment is trivial, treat as flat
            if (len < 2) {
                for (let i = segment.startFrame; i < segment.endFrame; i++) {
                    baselineHz[i] = macroF0[i];
                    intentHz[i] = 0;
                }
                slopes.push(0);
                continue;
            }

            let sumX = 0;
            let sumY = 0;
            let sumXY = 0;
            let sumXX = 0;

            // Use relative coordinates for X (0..len-1) to avoid large number precision issues
            for (let i = 0; i < len; i++) {
                const x = i;
                const frameIdx = segment.startFrame + i;
                const y = macroF0[frameIdx];
                
                sumX += x;
                sumY += y;
                sumXY += x * y;
                sumXX += x * x;
            }

            // Least Squares Linear Regression: y = mx + c
            const denominator = (len * sumXX - sumX * sumX);
            let slope = 0;
            let intercept = 0;

            if (Math.abs(denominator) > 1e-9) {
                slope = (len * sumXY - sumX * sumY) / denominator;
                intercept = (sumY - slope * sumX) / len;
            } else {
                // Vertical line or single point effective variance? Should not happen with distinct X
                // Fallback to average
                slope = 0;
                intercept = sumY / len;
            }

            slopes.push(slope);

            // Populate output arrays
            for (let i = 0; i < len; i++) {
                const x = i;
                const modelVal = slope * x + intercept;
                const frameIdx = segment.startFrame + i; // Correct offset
                
                baselineHz[frameIdx] = modelVal;
                // Intent is what's left after removing the declination trend
                intentHz[frameIdx] = macroF0[frameIdx] - modelVal;
            }
        }

        return {
            baselineHz,
            intentHz,
            slopes
        };
    }
}
