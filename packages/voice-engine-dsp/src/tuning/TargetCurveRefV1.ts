import { 
    F0TrackV1, VoicingMaskV1, TuneScoreV1, TargetCurveV1, 
    TuneScoreScaleConfigV1,
    parseKey, scaleToPitchClasses, nearestAllowedPitch 
} from "@mcptoolshop/voice-engine-core";

export class TargetCurveRefV1 {
    constructor() {}

    public generate(
        f0Track: F0TrackV1,
        voicing: VoicingMaskV1,
        score: TuneScoreV1
    ): TargetCurveV1 {
        // Validate inputs match in length/framing
        const numFrames = f0Track.f0MhzQ.length;
        const targetCentsQ = new Int32Array(numFrames);

        // Parse Score
        if (score.mode !== "scale") {
            throw new Error("Only scale mode supported in V1");
        }
        const config = score as TuneScoreScaleConfigV1;
        
        const { tonicMidi } = parseKey(config.key);
        const pitchClasses = scaleToPitchClasses(config.scale, tonicMidi);
        
        // Glide Logic
        const msPerFrame = 1000 / f0Track.frameHz;
        const glideFrames = config.glideMsQ > 0 ? config.glideMsQ / msPerFrame : 0;
        
        // Constant-Time Exponential Glide (1-pole IIR)
        // k = 1 / (glideFrames + 1)
        const k = glideFrames > 0 ? (1 / (glideFrames + 1)) : 1;

        let currentCentsQ = 0; // State
        let initialized = false;

        for (let i = 0; i < numFrames; i++) {
            const isVoiced = voicing.voicedQ[i] > 0;
            
            if (!isVoiced) {
                // If unvoiced, hold previous value.
                // If never initialized, default to tonic.
                if (!initialized) {
                    currentCentsQ = tonicMidi * 1000;
                    initialized = true;
                }
                targetCentsQ[i] = Math.round(currentCentsQ);
                continue;
            }

            // 1. Measure F0 -> Cents
            const f0Mhz = f0Track.f0MhzQ[i];
            const f0Hz = f0Mhz / 1000;
            
            // Safety check for invalid f0
            if (f0Hz <= 1) { // Basic safety floor
                 targetCentsQ[i] = Math.round(currentCentsQ);
                 continue;
            }

            // Standard MIDI Cents: 69000 + 12000 * log2(f / 440)
            const centsQ = 69000 + 12000 * Math.log2(f0Hz / 440);
            
            // 2. Quantize
            const goalCentsQ = nearestAllowedPitch(Math.round(centsQ), pitchClasses);

            // 3. Initialize if needed
            if (!initialized) {
                currentCentsQ = goalCentsQ;
                initialized = true;
            }

            // 4. Glide
            currentCentsQ += (goalCentsQ - currentCentsQ) * k;
            
            // 5. Store
            targetCentsQ[i] = Math.round(currentCentsQ);
        }
        
        return {
            sampleRateHz: f0Track.sampleRateHz,
            frameHz: f0Track.frameHz,
            hopSamples: f0Track.hopSamples,
            t0Samples: f0Track.t0Samples,
            targetCentsQ
        };
    }
}
