import { AudioBufferV1, VoicingMaskV1, F0TrackV1, AnalysisConfigV1 } from "@mcp-voice/core";
import { monoDownmix } from "../utils/AudioBufferUtils";

export interface VoicingConfig {
    silenceThreshold: number;
    voicingThreshold: number;
    windowMs: number;
}

export class VoicingDetectorRefV1 {
    constructor(private config: VoicingConfig) {}

    public analyze(buffer: AudioBufferV1, f0Track: F0TrackV1): VoicingMaskV1 {
        const audio = monoDownmix(buffer);
        const numFrames = f0Track.f0MhzQ.length;
        const hopSamples = f0Track.hopSamples;
        const windowSamples = Math.floor(this.config.windowMs * buffer.sampleRate / 1000); 
        
        const voicedQ = new Uint8Array(numFrames);
        const voicingProbQ = new Int16Array(numFrames);
        
        const zcrThreshold = 0.4;
        const zcrThreshQ = zcrThreshold * 10000;
        const silenceThreshQ = this.config.silenceThreshold * 10000;
        const voicingThreshQ = this.config.voicingThreshold * 10000;

        for (let i = 0; i < numFrames; i++) {
            const start = i * hopSamples;
            if (start + windowSamples > audio.length) {
                break;
            }

            let zeroCrossings = 0;
            let sumSq = 0;
            
            for (let j = 0; j < windowSamples; j++) {
                const samp = audio[start + j];
                sumSq += samp * samp;
                
                if (j > 0) {
                    const prev = audio[start + j - 1];
                    if ((prev >= 0 && samp < 0) || (prev < 0 && samp >= 0)) {
                        zeroCrossings++;
                    }
                }
            }
            
            const rms = Math.sqrt(sumSq / windowSamples);
            const zcr = zeroCrossings / windowSamples;
            
            const rmsQ = Math.min(10000, Math.round(rms * 10000));
            const zcrQ = Math.min(10000, Math.round(zcr * 10000));
            const confQ = f0Track.confQ[i];

            let isVoiced = 0;
            
            if (rmsQ > silenceThreshQ && confQ > voicingThreshQ && zcrQ < zcrThreshQ) {
                isVoiced = 1;
            }
            
            voicedQ[i] = isVoiced;
            voicingProbQ[i] = confQ; 
        }
        
        // Apply smoothing
        this.hangoverSmoothing(voicedQ, 2); 

        return {
            sampleRateHz: f0Track.sampleRateHz,
            frameHz: f0Track.frameHz,
            hopSamples: f0Track.hopSamples,
            t0Samples: f0Track.t0Samples,
            voicedQ,
            voicingProbQ
        };
    }

    private hangoverSmoothing(mask: Uint8Array, frames: number) {
        const len = mask.length;
        let hangoverCounter = 0;
        
        for (let i = 0; i < len; i++) {
            if (mask[i] === 1) {
                hangoverCounter = frames;
            } else {
                if (hangoverCounter > 0) {
                    mask[i] = 1;
                    hangoverCounter--;
                }
            }
        }
    }
}
