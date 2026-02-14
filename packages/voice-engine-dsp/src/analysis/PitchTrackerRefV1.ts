import { AudioBufferV1, F0TrackV1 } from "@mcptoolshop/voice-engine-core";
import { monoDownmix } from "../utils/AudioBufferUtils";

export interface PitchTrackerConfig {
    windowMs: number;
    hopMs: number;
    f0Min: number;
    f0Max: number;
}

export class PitchTrackerRefV1 {
    constructor(private config: PitchTrackerConfig) {}

    public analyze(buffer: AudioBufferV1): F0TrackV1 {
        const audio = monoDownmix(buffer);
        const sr = buffer.sampleRate;
        const windowSamples = Math.floor(this.config.windowMs * sr / 1000);
        const hopSamples = Math.floor(this.config.hopMs * sr / 1000);
        // Ensure lags are within search range
        const minLag = Math.floor(sr / this.config.f0Max);
        const maxLag = Math.floor(sr / this.config.f0Min); 

        // Calculate number of frames
        // We need audio up to start + windowSamples + maxLag
        // Last frame i: i * hopSamples + windowSamples + maxLag <= audio.length
        // i * hopSamples <= audio.length - windowSamples - maxLag
        let numFrames = 0;
        if (audio.length >= windowSamples + maxLag) {
             numFrames = Math.floor((audio.length - windowSamples - maxLag) / hopSamples) + 1;
        }

        const f0MhzQ = new Int32Array(numFrames);
        const confQ = new Int16Array(numFrames);
        const t0Samples = 0; 

        if (numFrames <= 0) {
             return {
                sampleRateHz: sr,
                frameHz: sr / hopSamples,
                hopSamples,
                t0Samples,
                f0MhzQ,
                confQ
            };
        }

        const difference = new Float32Array(maxLag + 2);
        const cmndf = new Float32Array(maxLag + 2);

        for (let i = 0; i < numFrames; i++) {
            const start = i * hopSamples;
            
            // 1. Difference function
            // d(tau) = sum_{j=0}^{W-1} (x[start+j] - x[start+j+tau])^2
            for (let tau = 1; tau <= maxLag; tau++) {
                let sum = 0;
                for (let j = 0; j < windowSamples; j++) {
                    const delta = audio[start + j] - audio[start + j + tau];
                    sum += delta * delta;
                }
                difference[tau] = sum;
            }
            difference[0] = 0;

            // 2. CMNDF
            cmndf[0] = 1;
            let runningSum = 0;
            for (let tau = 1; tau <= maxLag; tau++) {
                runningSum += difference[tau];
                if (runningSum === 0) {
                    cmndf[tau] = 1;
                } else {
                    cmndf[tau] = difference[tau] * tau / runningSum;
                }
            }

            // 3. Absolute Threshold
            let bestTau = -1;
            const threshold = 0.1;
            
            let found = false;
            // Only search in valid pitch range
            for (let tau = minLag; tau <= maxLag; tau++) {
                if (cmndf[tau] < threshold) {
                    // Start of a dip. Find local minimum in this dip.
                    let localTau = tau;
                    while (localTau + 1 <= maxLag && cmndf[localTau + 1] < cmndf[localTau]) {
                        localTau++;
                    }
                    bestTau = localTau;
                    found = true;
                    break;
                }
            }
            
            // If not found, use global minimum in range
            if (!found) {
                let minVal = Number.MAX_VALUE;
                for (let tau = minLag; tau <= maxLag; tau++) {
                    if (cmndf[tau] < minVal) {
                        minVal = cmndf[tau];
                        bestTau = tau;
                    }
                }
            }

            // 4. Parabolic Interpolation
            let refinedTau = bestTau;
            let currentF0 = 0;
            let confidence = 0;

            if (bestTau >= minLag && bestTau <= maxLag) {
                // Ensure we have neighbors
                if (bestTau > 0 && bestTau < maxLag + 1) { // bounds check within cmndf array size
                     // Note: cmndf size is maxLag + 2, valid indices 0..maxLag+1.
                     // bestTau is in [minLag, maxLag]. so bestTau >= 1.
                     const y1 = cmndf[bestTau - 1];
                     const y2 = cmndf[bestTau];
                     const y3 = cmndf[bestTau + 1];
                     
                     // Peak fitting (minimum)
                     const denom = (y1 - 2 * y2 + y3);
                     if (Math.abs(denom) > 1e-9) { // Avoid division by zero
                            const delta = (y1 - y3) / (2 * denom);
                            refinedTau = bestTau - delta;
                     }
                }

                if (refinedTau > 0) {
                    currentF0 = sr / refinedTau;
                }
                
                // Confidence: 1 - min_cmndf
                let minCmndf = cmndf[bestTau];
                if (minCmndf > 1) minCmndf = 1; 
                if (minCmndf < 0) minCmndf = 0;
                confidence = 1.0 - minCmndf;
            }

            f0MhzQ[i] = Math.round(currentF0 * 1000);
            confQ[i] = Math.round(confidence * 10000);
        }

        return {
            sampleRateHz: sr,
            frameHz: sr / hopSamples,
            hopSamples: hopSamples,
            t0Samples: 0,
            f0MhzQ,
            confQ
        };
    }
}
