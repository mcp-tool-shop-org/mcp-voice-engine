import { 
    IPitchShifter, 
    AudioBufferV1, F0TrackV1, VoicingMaskV1, TargetCurveV1, CorrectionEnvelopeV1 
} from "@mcp-voice/core";

export class PitchShifterRefV1 implements IPitchShifter {
    readonly id = "voice-engine-dsp.pitch-shifter.v1";
    readonly version = "1.0.0";

    capabilities(): string[] {
        return ["pitch-shift", "psola-lite"];
    }

    async shift(
        audio: AudioBufferV1,
        f0Track: F0TrackV1,
        voicing: VoicingMaskV1,
        target: TargetCurveV1,
        envelope: CorrectionEnvelopeV1
    ): Promise<AudioBufferV1> {
        // Validation
        const sr = audio.sampleRate;
        if (sr !== f0Track.sampleRateHz) {
             throw new Error("Sample rate mismatch");
        }

        const outData = new Float32Array(audio.data[0].length);
        const inData = audio.data[0]; // Mono assumption V1
        
        // Granular/PSOLA State
        let phase = 0;
        const frames = f0Track.f0MhzQ.length;
        const hop = f0Track.hopSamples;
        
        // Output pointer
        for (let i = 0; i < outData.length; i++) {
             // 1. Determine Frame Index
             const frameIdx = Math.floor(i / hop);
             if (frameIdx >= frames) break;

             // 2. Unvoiced Bypass
             // Check voicing
             const isVoiced = voicing.voicedQ[frameIdx] > 0;
             if (!isVoiced) {
                 // Simple bypass for now (Crossfade TODO for V1 polishing)
                 outData[i] = inData[i];
                 continue;
             }

             // 3. Calculate Target Pitch
             // Target F0
             const targetCents = target.targetCentsQ[frameIdx]; // Absolute cents * 10
             // Input F0
             let inputF0Mhz = f0Track.f0MhzQ[frameIdx];
             if (inputF0Mhz <= 0) inputF0Mhz = 100000; // Safe floor 100Hz

             // Correction Strength
             const strength = envelope.strengthQ[frameIdx] / 10000;
             
             // Calculate Ratio
             // delta = (target - measure)
             // Measure in cents: 69000 + 12000 * log2(f / 440)
             const inputHz = inputF0Mhz / 1000;
             const inputCents = 69000 + 12000 * Math.log2(inputHz / 440);
             
             // Interpolate target: delta * strength
             // Desired Cents = Input + (Target - Input) * strength
             const desiredCents = inputCents + (targetCents/10 - inputCents) * strength;
             
             // Frequency Ratio = 2 ^ ((Desired - Input) / 1200)
             // = 2 ^ ((Target - Input)*strength / 1200)
             const shiftCents = (desiredCents - inputCents);
             const ratio = Math.pow(2, shiftCents / 1200);

             // 4. PSOLA-lite Grain Trigger
             // Effective F0 = InputHz * Ratio
             const outputF0 = inputHz * ratio;
             
             // Advance Phase
             phase += outputF0 / sr;
             
             if (phase >= 1) {
                 phase -= 1;
                 // Emit Grain
                 // Grain Center: Current Time i (approx, for causal system)
                 // Grain Duration: 2 * Period (2 * sr / outputF0 ?) 
                 // Standard PSOLA uses 2 * InputPeriod to preserve formants?
                 // If we want natural formants: Use Input Period.
                 // If we want chipmunk: Use Output Period (Resampling).
                 // Prompt implies "Commit 3: Formant preservation hook".
                 // This implies Commit 2 should be simpler (Chipmunk?).
                 // Let's use 2 * InputPeriod for "Formant Preserving" base, 
                 // because it's actually simpler to implement "PSOLA" that way.
                 // Wait, if I change density (OutputF0) but keep grain duration (InputPeriod), 
                 // I am preserving formants. 
                 
                 const pIn = sr / inputHz;
                 const grainLen = Math.floor(2 * pIn);
                 
                 // Gain Compensation for Variable Overlap
                 // Overlap Factor = GrainLen / GrainSpacing
                 // Spacing = 1/outputF0 * sr
                 // Factor ~ (2/InputF0) / (1/OutputF0) = 2 * OutputF0 / InputF0
                 // We want constant energy? Hanning window sums to 0.5.
                 // If overlap is 2x, we sum to 1.0.
                 // So we divide by (Factor/2) = OutputF0/InputF0 ?
                 // Actually simpler: Gain = InputHz / OutputHz.
                 // If Output > Input (Pitch Up), Density High, Overlap High -> Scale Down.
                 const overlapGain = inputHz / outputF0;

                 // Add grain to output
                 // Window: Hanning
                 for (let k = 0; k < grainLen; k++) {
                     const pos = i - Math.floor(grainLen/2) + k;
                     if (pos >= 0 && pos < outData.length && pos < inData.length) {
                         const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * k / grainLen);
                         // Centered extraction:
                         // Input grain centered at 'i' (current time)
                         // But we iterate k from 0..Len.
                         // Input index: i - floor(Len/2) + k
                         // Output index: pos
                         
                         outData[pos] += inData[pos] * w * overlapGain; 
                     }
                 }
             }
        }
        
        // Normalize? 
        // Simple PSOLA often has gain issues. 
        // For V1 Determinism, we might need a limiter or fixed scaling.
        // Let's implement a simpler "Resample Frame" approach for reliability?
        // Prompt says "PSOLA-lite".
        
        return {
             ...audio,
             data: [outData]
        };
    }
}

function floor(x: number) { return Math.floor(x); }
