import { F0TrackV1 } from "../schema/AnalysisV1";
import { ProsodyAnalysisConfigV1, ProsodySegmentV1, ProsodySegmentKind } from "./ProsodyV1";

export class ProsodySegmenter {
    
    readonly version = "1.0.0";

    segment(
        audio: Float32Array, 
        f0: F0TrackV1,
        config: ProsodyAnalysisConfigV1 = {}
    ): ProsodySegmentV1[] {
        const segments: ProsodySegmentV1[] = [];
        
        // Defaults
        const silenceDb = config.silenceThresholdDb ?? -60;
        const voicingLimit = config.voicingThresholdQ ?? 2000;
        const enterLimit = config.voicedEnterFrames ?? 2; // Debounce
        const exitLimit = config.voicedExitFrames ?? 5;   // Hangover

        const numFrames = f0.confQ.length;
        const hop = f0.hopSamples;
        const t0Samples = f0.t0Samples;

        // State Machine
        let isVoicedState = false;
        
        let voicedEnterCount = 0;
        let voicedExitCount = 0;

        // Current Segment Tracking
        let currentKind: ProsodySegmentKind | null = null;
        let segStart = 0;

        // Stats accumulation for current segment
        let segConfSum = 0;
        let segEnergySum = 0;
        let segCount = 0;

        for (let i = 0; i < numFrames; i++) {
            // 1. Calculate Frame Energy (RMS)
            const center = Math.round(t0Samples + (i * hop));
            const start = center - Math.floor(hop / 2);
            const end = start + hop;
            
            let sumSq = 0;
            let sampleCount = 0;
            
            // Boundary checks
            const rStart = Math.max(0, start);
            const rEnd = Math.min(audio.length, end);
            
            if (rEnd > rStart) {
                for (let k = rStart; k < rEnd; k++) {
                    const s = audio[k];
                    sumSq += s * s;
                }
                sampleCount = rEnd - rStart;
            }

            let rmsDb = -100;
            if (sampleCount > 0) {
                const rms = Math.sqrt(sumSq / sampleCount);
                if (rms > 1e-9) {
                    rmsDb = 20 * Math.log10(rms);
                }
            }

            // 2. Input Conditions
            const isSpeechCandidate = rmsDb > silenceDb;
            const conf = f0.confQ[i];
            const isVoicedCandidate = isSpeechCandidate && (conf > voicingLimit);

            // 3. Hysteresis Logic
            if (isVoicedState) {
                if (!isVoicedCandidate) {
                     voicedExitCount++;
                     if (voicedExitCount > exitLimit) {
                         isVoicedState = false;
                         voicedExitCount = 0;
                         voicedEnterCount = 0;
                     }
                } else {
                    voicedExitCount = 0;
                }
            } else {
                if (isVoicedCandidate) {
                    voicedEnterCount++;
                    if (voicedEnterCount >= enterLimit) {
                        isVoicedState = true;
                        voicedEnterCount = 0;
                        voicedExitCount = 0;
                    }
                } else {
                    voicedEnterCount = 0;
                }
            }

            // 4. Determine Frame Kind
            let frameKind: ProsodySegmentKind = "silence";
            if (isVoicedState) {
                frameKind = "voiced";
            } else if (isSpeechCandidate) {
                frameKind = "unvoiced";
            } else {
                frameKind = "silence";
            }
            
            // 5. Aggregate Segments
            if (currentKind === null) {
                currentKind = frameKind;
                segStart = i;
                segConfSum = conf;
                segEnergySum = rmsDb;
                segCount = 1;
            } else if (currentKind !== frameKind) {
                // Close previous
                if (segCount > 0) {
                    segments.push({
                        kind: currentKind,
                        startFrame: segStart,
                        endFrame: i, 
                        avgConfQ: Math.round(segConfSum / segCount),
                        avgEnergyDb: segEnergySum / segCount
                    });
                }
                
                // Start new
                currentKind = frameKind;
                segStart = i;
                segConfSum = conf;
                segEnergySum = rmsDb;
                segCount = 1;
            } else {
                segConfSum += conf;
                segEnergySum += rmsDb;
                segCount++;
            }
        }
        
        // Finalize last segment
        if (currentKind !== null && segCount > 0) {
             segments.push({
                kind: currentKind,
                startFrame: segStart,
                endFrame: numFrames,
                avgConfQ: Math.round(segConfSum / segCount),
                avgEnergyDb: segEnergySum / segCount
            });
        }

        return segments;
    }
}
