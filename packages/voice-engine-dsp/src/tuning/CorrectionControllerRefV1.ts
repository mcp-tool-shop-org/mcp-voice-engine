import { 
    F0TrackV1, VoicingMaskV1, TuneScoreV1, CorrectionEnvelopeV1,
    TuneScoreScaleConfigV1
} from "@mcptoolshop/voice-engine-core";

export class CorrectionControllerRefV1 {
    constructor() {}
    
    public generate(
         f0Track: F0TrackV1,
         voicing: VoicingMaskV1,
         score: TuneScoreV1
    ): CorrectionEnvelopeV1 {
        const numFrames = f0Track.f0MhzQ.length;
        const strengthQ = new Int16Array(numFrames);
        
        if (score.mode !== "scale") {
             throw new Error("Only scale mode supported in V1");
        }
        const config = score as TuneScoreScaleConfigV1;
        const baseStrength = config.snapStrengthQ;

        // Pass 1: Raw Strength Calculation
        for (let i = 0; i < numFrames; i++) {
            const isVoiced = voicing.voicedQ[i] > 0;
            if (!isVoiced) {
                strengthQ[i] = 0;
            } else {
                const conf = f0Track.confQ[i];
                // strength = snapStrengthQ * (confQ / 10000)
                // Linear scaling by confidence
                strengthQ[i] = Math.round(baseStrength * (conf / 10000));
            }
        }

        // Pass 2: Boundary Softening (Distance Transform)
        // If dist(unvoiced) < 3, strength *= dist/3
        const dist = new Int32Array(numFrames).fill(numFrames + 1);

        // Init distance 0 at unvoiced frames
        for (let i = 0; i < numFrames; i++) {
            if (voicing.voicedQ[i] === 0) {
                dist[i] = 0;
            }
        }

        // Forward scan
        for (let i = 1; i < numFrames; i++) {
            dist[i] = Math.min(dist[i], dist[i - 1] + 1);
        }

        // Backward scan
        for (let i = numFrames - 2; i >= 0; i--) {
            dist[i] = Math.min(dist[i], dist[i + 1] + 1);
        }

        // Apply erosion
        for (let i = 0; i < numFrames; i++) {
            const d = dist[i];
            if (d < 3) {
                // d=0 -> strength=0 (already set)
                // d=1 -> strength*=1/3
                // d=2 -> strength*=2/3
                strengthQ[i] = Math.floor((strengthQ[i] * d) / 3);
            }
        }

        return {
            sampleRateHz: f0Track.sampleRateHz,
            frameHz: f0Track.frameHz,
            hopSamples: f0Track.hopSamples,
            t0Samples: f0Track.t0Samples,
            strengthQ
        };
    }
}
