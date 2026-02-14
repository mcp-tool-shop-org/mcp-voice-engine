import { F0TrackV1, VoicingMaskV1, TunePlanV1, TargetCurveV1, CorrectionEnvelopeV1 } from "@mcptoolshop/voice-engine-core";

export class CorrectionController {
    generate(
        f0: F0TrackV1,
        voicing: VoicingMaskV1,
        target: TargetCurveV1,
        plan: TunePlanV1
    ): CorrectionEnvelopeV1 {
        const len = f0.f0MhzQ.length;
        const strengthQ = new Int16Array(len);
        
        const baseSnap = plan.parameters.snapStrengthQ / 10000.0; // 0..1
        const protection = plan.parameters.consonantProtectionQ / 10000.0; // 0..1
        const speedVal = plan.parameters.retuneSpeedQ; // 0..10000
        
        // Phase 6 Controls
        const globalMix = (plan.parameters.globalStrengthQ ?? 10000) / 10000.0; // 0..1
        const attackMs = plan.parameters.attackMsQ ?? 0;
        const releaseMs = plan.parameters.releaseMsQ ?? 0;
        
        // Time constants
        // const frameDur = f0.hopSamples / f0.sampleRateHz; // e.g. 0.01s
        const frameDur = 0.01; // Force 10ms for debugging if needed
        
        let alphaAtt = attackMs > 0 ? (1.0 - Math.exp(-frameDur / (attackMs / 1000.0))) : 1.0;
        let alphaRel = releaseMs > 0 ? (1.0 - Math.exp(-frameDur / (releaseMs / 1000.0))) : 1.0;
        
        let currentStrength = 0;

        // Retune Speed Model:
        // low speed => low alpha (lazy correction). high speed => high alpha.
        // If speed=10000 (100%), alpha=1.0 (Instant).
        // If speed=0 (0%), alpha=0.01 (Very slow).
        // Exponential map typical for speed knobs? Linear is fine for V1.
        const alpha = Math.max(0.01, speedVal / 10000.0);

        let smoothDiff = 0;

        for (let i = 0; i < len; i++) {
            const isVoiced = voicing.voicedQ[i] > 0;
            if (!isVoiced) {
                strengthQ[i] = 0;
                smoothDiff = 0; // Reset state on unvoiced
                continue;
            }

            // 1. Calculate Raw Difference (Target - Input)
            // Need Input Cents. Re-calc or assume we have it?
            // Re-calc is safest (pure).
            let f0Hz = f0.f0MhzQ[i] / 1000.0;
            if (f0Hz < 20) f0Hz = 20; // Guard
            const inputCents = 6900 + 1200 * Math.log2(f0Hz / 440);
            const targetVal = target.targetCentsQ[i] / 1000.0; // Milli-Cents to Cents

            const rawDiff = targetVal - inputCents;

            // 2. Apply Retune Speed (Smoothing the Correction)
            smoothDiff += alpha * (rawDiff - smoothDiff);

            // 3. Calculate Ratio Strength
            // Wanted Correction = smoothDiff.
            // Available Correction = rawDiff.
            // Strength = smoothDiff / rawDiff.
            let ratio = 0;
            if (Math.abs(rawDiff) > 0.001) {
                ratio = smoothDiff / rawDiff;
            } else {
                ratio = 1.0; // Already there
            }
            
            // Clamp ratio 0..1? 
            // If overshoot (ringing), ratio > 1. 
            // Usually we clamp strength 0..1 for artifacts.
            ratio = Math.max(0, Math.min(1, ratio));

            // 4. Protection
            // If confidence is low, reduce max strength.
            // confQ: 0..10000.
            const conf = f0.confQ[i] / 10000.0;
            // protectedMax = 1.0 - protection * (1.0 - conf)
            // If protection=1, and conf=0 => max=0.
            // If protection=0 => max=1.
            const confCheck = Math.max(0, 1.0 - protection * (1.0 - conf));

            // 5. Final Strength
            // Base Snap * Computed Ratio * Protection * Global Mix (Phase 6)
            let targetStrength = baseSnap * ratio * confCheck * globalMix;
            
            // 6. Attack / Release Smoothing
            if (targetStrength > currentStrength) {
                // console.log(`Debug Att: Target=${targetStrength}, Curr=${currentStrength}, Alpha=${alphaAtt}`);
                currentStrength += (targetStrength - currentStrength) * alphaAtt;
            } else {
                currentStrength += (targetStrength - currentStrength) * alphaRel;
            }

            strengthQ[i] = Math.floor(currentStrength * 10000);
        }

        return {
            sampleRateHz: f0.sampleRateHz,
            frameHz: f0.frameHz,
            hopSamples: f0.hopSamples,
            t0Samples: f0.t0Samples,
            strengthQ
        };
    }
}
