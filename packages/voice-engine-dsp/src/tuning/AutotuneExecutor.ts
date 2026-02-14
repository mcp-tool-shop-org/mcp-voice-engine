import { 
    TuneRequestV1, AudioBufferV1,
    TunePlanResolver,
    F0TrackV1, VoicingMaskV1
} from "@mcp-voice/core";
import { PitchTrackerRefV1 } from "../analysis/PitchTrackerRefV1.js";
import { PitchShifterRefV1 } from "../transformation/PitchShifterRefV1.js";
import { TargetCurveGenerator } from "./TargetCurveGenerator.js";
import { CorrectionController } from "./CorrectionController.js";

export class AutotuneExecutor {
    private resolver = new TunePlanResolver();
    
    // Default trackers - could be overridden or config passed in
    private tracker = new PitchTrackerRefV1({
        windowMs: 40,
        hopMs: 10,
        f0Min: 50,
        f0Max: 1000
    });
    
    private curveGen = new TargetCurveGenerator();
    private envGen = new CorrectionController();
    private shifter = new PitchShifterRefV1(); // "PSOLA-lite"

    async execute(req: TuneRequestV1, audio: AudioBufferV1): Promise<AudioBufferV1> {
        // 1. Resolve Plan
        const plan = this.resolver.resolve(req);

        // 2. Analyze Pitch
        const f0Analysis = this.tracker.analyze(audio);
        // console.log(`Debug Analysis: ${f0Analysis.f0MhzQ.length} frames. SR: ${f0Analysis.sampleRateHz}`);
        
        // Debug Middle Frame
        const mid = Math.floor(f0Analysis.f0MhzQ.length / 2);
        // console.log(`Debug F0[${mid}]:`, f0Analysis.f0MhzQ[mid] / 1000, "Hz");
        
        // 3. Derive Voicing (Simple Threshold)
        // In a real pipeline, use a dedicated voicing estimator (SVM/DNN).
        // Here we trust the tracker's confidence or F0 stability.
        const len = f0Analysis.f0MhzQ.length;
        const voicedQ = new Uint8Array(len);
        const voicingProbQ = new Int16Array(len);
        
        // Debug Max Conf
        // let maxC = 0;

        for (let i = 0; i < len; i++) {
            const conf = f0Analysis.confQ[i];
            const f0 = f0Analysis.f0MhzQ[i];
            
            // Heuristic: Conf > 1500 (15%) and F0 > 40Hz
            const isVoiced = (conf > 1500 && f0 > 40000); 
            voicedQ[i] = isVoiced ? 1 : 0;
            voicingProbQ[i] = isVoiced ? 10000 : 0;
        }

        const voicing: VoicingMaskV1 = {
            sampleRateHz: f0Analysis.sampleRateHz,
            frameHz: f0Analysis.frameHz,
            hopSamples: f0Analysis.hopSamples,
            t0Samples: f0Analysis.t0Samples,
            voicedQ,
            voicingProbQ
        };

        // 4. Generate Control Curves
        const target = this.curveGen.generate(f0Analysis, voicing, plan);
        const envelope = this.envGen.generate(f0Analysis, voicing, target, plan);

        // 5. Apply Pitch Shift
        const result = await this.shifter.shift(audio, f0Analysis, voicing, target, envelope);

        return result;
    }
}
