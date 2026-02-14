import { 
    TuneRequestV1, AudioBufferV1,
    TunePlanResolver,
    F0TrackV1, VoicingMaskV1
} from "@mcptoolshop/voice-engine-core";
import { PitchTrackerRefV1 } from "../analysis/PitchTrackerRefV1.js";
import { PitchShifterRefV1 } from "../transformation/PitchShifterRefV1.js";
import { TargetCurveGenerator } from "./TargetCurveGenerator.js";
import { CorrectionController } from "./CorrectionController.js";
import { F0Decomposer } from "../../../voice-engine-core/src/prosody/F0Decomposer.js";
import { ProsodySegmenter } from "../../../voice-engine-core/src/prosody/ProsodySegmenter.js";
import { PhraseBaselineModel } from "../../../voice-engine-core/src/prosody/PhraseBaselineModel.js";
import { TargetStabilizer } from "../../../voice-engine-core/src/prosody/TargetStabilizer.js";
import { ProsodyEventV1, ProsodyPlanV1 } from "../../../voice-engine-core/src/prosody/ProsodyV1.js";
import { AccentRenderer } from "../prosody/AccentRenderer.js";
import { TargetCurveV1 } from "@mcptoolshop/voice-engine-core";
import { 
    HARD_TUNE_PRESET, 
    NATURAL_PRESET, 
    SUBTLE_PRESET, 
    ProsodyPresetV1 
} from "../../../voice-engine-core/src/config/ProsodyPresets.js";
import { resolveProsodyStyle } from "../../../voice-engine-core/src/config/ProsodyStyles.js";


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

        // Phase 8: Expressive Rendering (8.4 Style Profiles)
        const style = resolveProsodyStyle(req.style || 'speech_neutral');
        
        if (req.events && req.events.length > 0) {
            const frameRateHz = f0Analysis.sampleRateHz / f0Analysis.hopSamples;
            const accentOffsets = AccentRenderer.render(req.events, frameCount, style, frameRateHz);
            
            // Add offsets to stabilized target
            for (let i = 0; i < frameCount; i++) {
                if (stabilized.noteIds[i] >= 0) {
                    stabilized.targetCents[i] += accentOffsets[i];
                }
            }

            // Phase 8.5: Post-Focus Compression (PFC)
            // Reduces pitch range/variance after a strong focus event to de-accentuate specific information.
            if (style.postFocusCompression > 0) {
                // 1. Find the strongest accent (focus)
                let maxStrength = 0;
                let focusTime = -1;
                
                // Simple approach: global max in request
                for (const event of req.events) {
                    if (event.type === 'accent' && event.strength > maxStrength) {
                         maxStrength = event.strength;
                         focusTime = event.time;
                    }
                }

                // Threshold to trigger PFC (e.g. > 0.5 strength)
                if (maxStrength > 0.5 && focusTime >= 0 && focusTime < frameCount - 1) {
                    const pfcStrength = style.postFocusCompression;
                    
                    // Apply compression for frames AFTER the focus event
                    // We can retain a small buffer (e.g. 50ms) before compressing fully
                    // But for now, let's just start compressing after focusTime + span/2 or similar?
                    // User said: For frames t > focusTime (center).
                    // Let's add a small grace period (e.g. 10 frames = 100ms) to let the accent finish falling.
                    // Or just strict t > focusTime.
                    
                    for (let t = focusTime; t < frameCount; t++) {     
                         // We need baseline in Cents.
                         // baseline.baselineHz[t] -> Cents (MIDI absolute)
                         // 440Hz = 6900 cents.
                         // cents = 6900 + 1200 * log2(hz / 440)
                         
                         const bHz = baseline.baselineHz[t];
                         if (bHz > 10) { // avoid log(0)
                             const baselineCents = 6900 + 1200 * Math.log2(bHz / 440);
                             
                             // Calculate deviation of current target from baseline
                             const currentCents = stabilized.targetCents[t];
                             const deviation = currentCents - baselineCents;
                             
                             // Compress deviation
                             // newDeviation = deviation * (1 - pfcStrength)
                             // newTarget = baselineCents + newDeviation
                             
                             // Ramp-in the compression? 
                             // Let's do a simple linear ramp over 20 frames (200ms)
                             let ramp = 1.0;
                             if (t < focusTime + 20) {
                                 ramp = (t - focusTime) / 20.0;
                             }
                             
                             const effectiveCompression = pfcStrength * ramp;
                             
                             stabilized.targetCents[t] = baselineCents + (deviation * (1 - effectiveCompression));
                         }
                    }
                }
            }
        }

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
