import { 
    TuneRequestV1, AudioBufferV1,
    TunePlanResolver,
    F0TrackV1, VoicingMaskV1
} from "@mcp-voice/core";
import { PitchTrackerRefV1 } from "../analysis/PitchTrackerRefV1.js";
import { PitchShifterRefV1 } from "../transformation/PitchShifterRefV1.js";
import { TargetCurveGenerator } from "./TargetCurveGenerator.js";
import { CorrectionController } from "./CorrectionController.js";
import { F0Decomposer } from "../../voice-engine-core/src/prosody/F0Decomposer.js";
import { ProsodySegmenter } from "../../voice-engine-core/src/prosody/ProsodySegmenter.js";
import { PhraseBaselineModel } from "../../voice-engine-core/src/prosody/PhraseBaselineModel.js";

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
    private decomposer = new F0Decomposer();
    private segmenter = new ProsodySegmenter();
    private baselineModel = new PhraseBaselineModel();

    async execute(req: TuneRequestV1, audio: AudioBufferV1): Promise<AudioBufferV1> {
        // 1. Resolve Plan
        const plan = this.resolver.resolve(req);

        // 2. Analyze Pitch
        const f0Analysis = this.tracker.analyze(audio);
        const frameCount = f0Analysis.f0MhzQ.length;

        // 2b. Compute Energy (needed for segmentation)
        // We assume channel 0. window/hop from f0Analysis if available, or tracker config.
        const hopSamples = f0Analysis.hopSamples || Math.floor(audio.sampleRate * 0.010);
        // Approximation: usually window is 4x hop or explicit. Let's assume 40ms from tracker default.
        const windowSamples = Math.floor(audio.sampleRate * 0.040); 
        const energyDb = this.calculateEnergyDb(audio.channels[0], frameCount, hopSamples, windowSamples);
        
        // 3. Decompose Pitch (New in Phase 7.2)
        // We separate macro (intonation) from micro (jitter/vibrato).
        const decomposition = this.decomposer.decompose(f0Analysis);

        // 3b. Prosody Segmentation (Phase 7.1)
        // Identify voiced vs unvoiced vs silence phrases.
        // We convert Int16 confQ to 0..10000. Assuming tracker output is compatible or we use it directly.
        // PitchTrackerRefV1 confQ is likely Uint16 or Float. Let's cast/ensure.
        // If f0Analysis.confQ is float 0..1, scale. If 0..10000, use as is.
        // Assuming current tracker ref uses 0..10000 range based on usage in loop below (conf > 1500).
        const segments = this.segmenter.analyze({
            energyDb: energyDb,
            confidenceQ: f0Analysis.confQ, // Assuming type compatibility or Uint16Array
            frameCount: frameCount
        });

        // 3c. Phrase Baseline (Phase 7.3)
        // Model the declination trend of each phrase.
        const baseline = this.baselineModel.analyze(segments, decomposition.macro.valuesHz);
        
        // Debug Phase 7 Info
        // console.log(`[Prosody] Frames: ${frameCount}, Segments: ${segments.length}`);
        
        // 3d. Derive Voicing (Enhanced with Segments)
        // Instead of raw heuristic, we can now use the segments to define the voicing mask.
        const voicedQ = new Uint8Array(frameCount);
        const voicingProbQ = new Int16Array(frameCount);
        
        for (const seg of segments) {
            if (seg.kind === 'voiced') {
                for (let i = seg.startFrame; i < seg.endFrame; i++) {
                    voicedQ[i] = 1;
                    voicingProbQ[i] = 10000;
                }
            }
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

    private calculateEnergyDb(signal: Float32Array, frameCount: number, hopSamples: number, windowSamples: number): Float32Array {
        const energyDb = new Float32Array(frameCount);
        const len = signal.length;

        for (let i = 0; i < frameCount; i++) {
            const start = i * hopSamples;
            const end = Math.min(start + windowSamples, len);
            if (end <= start) {
                energyDb[i] = -120;
                continue;
            }
            
            let sumSq = 0;
            for (let j = start; j < end; j++) {
                sumSq += signal[j] * signal[j];
            }
            const rms = Math.sqrt(sumSq / (end - start));
            energyDb[i] = rms > 1e-9 ? 20 * Math.log10(rms) : -120;
        }
        return energyDb;
    }
}
