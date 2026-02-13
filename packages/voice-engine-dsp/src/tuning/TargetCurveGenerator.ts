import { F0TrackV1, VoicingMaskV1, TunePlanV1, TargetCurveV1 } from "@mcp-voice/core";
import { ScaleQuantizer } from "./ScaleQuantizer.js";

export class TargetCurveGenerator {
    generate(
        f0: F0TrackV1,
        voicing: VoicingMaskV1,
        plan: TunePlanV1
    ): TargetCurveV1 {
        const len = f0.f0MhzQ.length;
        const targetCentsQ = new Int32Array(len);
        
        const allowed = plan.scaleConfig.allowedPitchClasses;
        const glideMs = plan.parameters.glideMsQ;
        const dtMs = (f0.hopSamples / f0.sampleRateHz) * 1000;
        
        // Glide Factor (1-pole exponential approach)
        // alpha = 1 - exp(-dt / tau)
        // usage: y = y + alpha * (target - y)
        // If glideMs (tau) is 0, alpha = 1.
        let alpha = 1.0;
        if (glideMs > 0) {
            alpha = 1.0 - Math.exp(-dtMs / Math.max(1, glideMs));
        }

        let currentCents = 0;
        let p_initialized = false;

        for (let i = 0; i < len; i++) {
            // 1. Get Input Pitch
            const isVoiced = voicing.voicedQ[i] > 0;
            
            if (!isVoiced) {
                // If not initialized, default to something sane (e.g. 6900)
                // But generally hold last value.
                if (!p_initialized) {
                    currentCents = 6900; 
                    p_initialized = true;
                }
                // Hold last
                targetCentsQ[i] = Math.round(currentCents * 1000);
                continue;
            }

            let f0Hz = f0.f0MhzQ[i] / 1000.0;
            // Sanity clamp
            if (f0Hz < 20) f0Hz = 20;

            // MIDI 69 = A4 440Hz = 6900 cents
            // Cents = 6900 + 1200 * log2(Hz/440)
            const inputCents = 6900 + 1200 * Math.log2(f0Hz / 440);

            // 2. Quantize
            const targetNote = ScaleQuantizer.quantize(inputCents, allowed);

            // 3. Glide
            if (!p_initialized) {
                currentCents = targetNote;
                p_initialized = true;
            } else {
                 if (alpha >= 0.999) {
                     currentCents = targetNote;
                 } else {
                     currentCents += alpha * (targetNote - currentCents);
                 }
            }

            targetCentsQ[i] = Math.round(currentCents * 1000);
        }

        return {
            sampleRateHz: f0.sampleRateHz,
            frameHz: f0.frameHz,
            hopSamples: f0.hopSamples,
            t0Samples: f0.t0Samples,
            targetCentsQ
        };
    }
}
