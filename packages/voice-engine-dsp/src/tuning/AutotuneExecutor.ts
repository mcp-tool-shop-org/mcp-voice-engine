import { 
    TuneRequestV1, AudioBufferV1,
    TunePlanResolver,
    F0TrackV1, VoicingMaskV1
} from "@mcp-voice/core";
import { PitchTrackerRefV1 } from "../analysis/PitchTrackerRefV1.js";
import { PitchShifterRefV1 } from "../transformation/PitchShifterRefV1.js";
import { TargetCurveGenerator } from "./TargetCurveGenerator.js";
import { CorrectionController } from "./CorrectionController.js";
import { F0Decomposer } from "../../../voice-engine-core/src/prosody/F0Decomposer.js";
import { ProsodySegmenter } from "../../../voice-engine-core/src/prosody/ProsodySegmenter.js";
import { PhraseBaselineModel } from "../../../voice-engine-core/src/prosody/PhraseBaselineModel.js";
import { TargetStabilizer } from "../../../voice-engine-core/src/prosody/TargetStabilizer.js";
import { TargetCurveV1 } from "@mcp-voice/core";
import { 
    HARD_TUNE_PRESET, 
    NATURAL_PRESET, 
    SUBTLE_PRESET, 
    ProsodyPresetV1 
} from "../../../voice-engine-core/src/config/ProsodyPresets.js";


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
    private stabilizer = new TargetStabilizer();

    private resolveProsodyPreset(presetName?: string): ProsodyPresetV1 {
        switch (presetName) {
            case "hard":
            case "robot":
                return HARD_TUNE_PRESET;
            case "subtle":
                return SUBTLE_PRESET;
            case "natural":
            case "pop":
            default:
                return NATURAL_PRESET;
        }
    }

    async execute(req: TuneRequestV1, audio: AudioBufferV1): Promise<AudioBufferV1> {
        // 1. Resolve Plan
        const plan = this.resolver.resolve(req);
        const preset = this.resolveProsodyPreset(req.preset);

        // 2. Analyze Pitch
        const f0Analysis = this.tracker.analyze(audio);
        const frameCount = f0Analysis.f0MhzQ.length;

        // 3. Decompose Pitch (New in Phase 7.2)
        // We separate macro (intonation) from micro (jitter/vibrato).
        const decomposition = this.decomposer.decompose(f0Analysis);

        // 3b. Prosody Segmentation (Phase 7.1)
        // Identify voiced vs unvoiced vs silence phrases.
        const segments = this.segmenter.segment(audio.data[0], f0Analysis, preset.analysis);

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
        // Old Method:
        // const target = this.curveGen.generate(f0Analysis, voicing, plan);
        
        // Phase 7.4 Target Stabilizer Integration:
        // Stabilize the INTENT curve (macro - baseline)
        const stabilized = this.stabilizer.stabilize(baseline.intentHz, segments, {
            allowedPitchClasses: plan.scaleConfig?.allowedPitchClasses,
            hysteresisCents: preset.stabilizer.hysteresisCents,
            minHoldMs: preset.stabilizer.minHoldMs,
            switchRampMs: preset.stabilizer.switchRampMs,
            transitionSlopeThreshCentsPerSec: preset.stabilizer.transitionSlopeThreshCentsPerSec,
            rootOffsetCents: 0
        }, f0Analysis.frameHz);

        // Re-construct the Final Target Curve
        // Final Target = Stabilized Intent + Micro (Vibrato)
        // Note: baseline is discarded (flattened out) if we just use Stabilized.
        // If we want to strictly follow the scale, we discard the baseline declination.
        const finalTargetCentsQ = new Int32Array(frameCount);

        for (let i = 0; i < frameCount; i++) {
            if (stabilized.noteIds[i] >= 0) {
                // Stabilized Cents (e.g. 6900.0)
                const stabCents = stabilized.targetCents[i];
                
                // Micro deviation in Hz -> Cents
                // microHz is deviation from macroHz
                // We approximate Cents Micro: 1200 * log2((macro + micro) / macro)
                // Wait, micro is deviation around 0? No, F0Decomposer says "Relative Pitch Deviation (e.g., +2.5)".
                
                const macroHz = decomposition.macro.valuesHz[i];
                const microHz = decomposition.micro.valuesHz[i];
                let microCents = 0;
                
                if (macroHz > 10) {
                    microCents = 1200 * Math.log2((macroHz + microHz) / macroHz);
                }

                // Final Cents = Stabilized + Micro
                const finalCents = stabCents + microCents;

                // Convert to Int32 Scaled (x1000)
                finalTargetCentsQ[i] = Math.round(finalCents * 1000);
            } else {
                // Unvoiced - hold last or default?
                // Let's copy from curveGen behavior or input pitch
                // Here we just use 0 or last. Shifter usually ignores target for unvoiced.
                finalTargetCentsQ[i] = 0;
            }
        }
        
        const target: TargetCurveV1 = {
             sampleRateHz: f0Analysis.sampleRateHz,
             frameHz: f0Analysis.frameHz,
             hopSamples: f0Analysis.hopSamples,
             t0Samples: f0Analysis.t0Samples,
             targetCentsQ: finalTargetCentsQ
        };
        
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
