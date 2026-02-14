import { F0TrackV1 } from '../../packages/voice-engine-core/src/schema/AnalysisV1';

export type SegmentKind = 'voiced' | 'unvoiced' | 'silence';

export interface Segment {
    startFrame: number;
    endFrame: number;
    kind: SegmentKind;
}

export interface SegmentationOptions {
    /** RMS energy threshold (dB) to transition from Silence to Unvoiced/Voiced */
    speechStartThresholdDb: number;
    /** RMS energy threshold (dB) to transition from Unvoiced/Voiced to Silence */
    speechStopThresholdDb: number;
    /** Confidence threshold (0-10000) for Voiced classification */
    voicingThreshold: number;
}

export class ProsodySegmenter {
    /**
     * Segments audio into Voiced/Unvoiced/Silence regions using F0Track and RMS energy hysteresis.
     * Uses 'hopSamples' window for energy calculation aligned to frame center.
     */
    static segment(
        f0Track: F0TrackV1,
        audio: Float32Array,
        options: SegmentationOptions
    ): Segment[] {
        const numFrames = f0Track.f0MhzQ.length;
        const frameKinds: SegmentKind[] = new Array(numFrames);
        const { hopSamples, t0Samples } = f0Track;

        let isSpeech = false;

        for (let i = 0; i < numFrames; i++) {
            // Calculate Frame Energy
            // Align window center to frame time: t = t0Samples + i * hopSamples
            const centerSample = Math.round(t0Samples + (i * hopSamples));
            // Use window size = hopSamples
            const halfWindow = Math.floor(hopSamples / 2);
            const startSample = centerSample - halfWindow; // Inclusive
            const endSample = startSample + hopSamples;    // Exclusive

            const rmsDb = ProsodySegmenter.calculateRmsDb(audio, startSample, endSample);

            // Energy Hysteresis (Silence vs Speech)
            if (isSpeech) {
               if (rmsDb < options.speechStopThresholdDb) {
                   isSpeech = false;
               }
            } else {
               if (rmsDb >= options.speechStartThresholdDb) {
                   isSpeech = true;
               }
            }

            // Classification
            if (!isSpeech) {
                frameKinds[i] = 'silence';
            } else {
                // Speech: Voiced vs Unvoiced based on F0 confidence
                const conf = f0Track.confQ[i];
                if (conf >= options.voicingThreshold) {
                    frameKinds[i] = 'voiced';
                } else {
                    frameKinds[i] = 'unvoiced';
                }
            }
        }

        return ProsodySegmenter.mergeSegments(frameKinds);
    }

    private static calculateRmsDb(audio: Float32Array, start: number, end: number): number {
        // Clamp indices
        const s = Math.max(0, start);
        const e = Math.min(audio.length, end);
        const len = e - s;
        
        if (len <= 0) return -100.0;

        let sumSq = 0.0;
        for (let i = s; i < e; i++) {
            const sample = audio[i];
            sumSq += sample * sample;
        }
        
        const meanSq = sumSq / len;
        if (meanSq < 1e-9) return -100.0;
        
        // 10*log10(meanSq) is equivalent to 20*log10(rms)
        return 10 * Math.log10(meanSq); 
    }

    private static mergeSegments(kinds: SegmentKind[]): Segment[] {
        const segments: Segment[] = [];
        if (kinds.length === 0) return segments;

        let currentKind = kinds[0];
        let startFrame = 0;

        for (let i = 1; i < kinds.length; i++) {
            if (kinds[i] !== currentKind) {
                segments.push({
                    kind: currentKind,
                    startFrame,
                    endFrame: i
                });
                currentKind = kinds[i];
                startFrame = i;
            }
        }

        // Final segment
        segments.push({
            kind: currentKind,
            startFrame,
            endFrame: kinds.length
        });

        return segments;
    }
}
