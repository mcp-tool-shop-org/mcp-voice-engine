import { IFormantStrategy, AudioBufferV1 } from "@mcptoolshop/voice-engine-core";

export class FormantStrategyV1 implements IFormantStrategy {
    async apply(tuned: AudioBufferV1, original: AudioBufferV1): Promise<AudioBufferV1> {
        const outData = new Float32Array(tuned.data[0]);
        // const origData = original.data[0]; 
        
        // 1. Spectral Tilt / Dynamics Guard (RMS Matching)
        // Simple global RMS match for V1 to prevent massive gain changes
        // Or frame-based? Global is safer.
        /* 
        let sumSqTuned = 0;
        let sumSqOrig = 0;
        for (let i = 0; i < outData.length; i++) sumSqTuned += outData[i] * outData[i];
        for (let i = 0; i < origData.length; i++) sumSqOrig += origData[i] * origData[i];
        
        const rmsGain = Math.sqrt((sumSqOrig + 1e-9) / (sumSqTuned + 1e-9));
        // Apply Gain (Softly)
        for (let i = 0; i < outData.length; i++) outData[i] *= rmsGain;
        */

        // 2. Artifact Guard (Limiter / Soft Clip)
        // Soft clip: tanh
        for (let i = 0; i < outData.length; i++) {
            let s = outData[i];
            
            // Soft Clip
            if (s > 1.0 || s < -1.0) {
                 s = Math.tanh(s);
            }
            // De-click / Smoothing (Simple Lowpass)? 
            // No, strictly limiter for V1 safety.
            
            outData[i] = s;
        }

        return {
            ...tuned,
            data: [outData]
        };
    }
}
