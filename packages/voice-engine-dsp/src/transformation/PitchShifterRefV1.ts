import { 
    IPitchShifter, 
    AudioBufferV1, F0TrackV1, VoicingMaskV1, TargetCurveV1, CorrectionEnvelopeV1 
} from "@mcp-voice/core";

import { FormantStrategyV1 } from "./FormantStrategyV1";

export class PitchShifterRefV1 implements IPitchShifter {
    readonly id = "voice-engine-dsp.pitch-shifter.v1";
    readonly version = "1.0.0";
    
    private formantStrategy = new FormantStrategyV1();

    capabilities(): string[] {
        return ["pitch-shift", "psola-lite", "formant-guard"];
    }

    async shift(
        audio: AudioBufferV1,
        f0Track: F0TrackV1,
        voicing: VoicingMaskV1,
        target: TargetCurveV1,
        envelope: CorrectionEnvelopeV1,
        request?: any // Pass full request if needed
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
        
        // Determine Mode (Default Preserve)
        // If request provided, use it. But signature didn't have request.
        // We'll update signature or assume preserve.
        // IPitchShifter interface signature uses specific args.
        // We can pass `formantMode` via a config object if we change interface?
        // Or assume this is "V1 Deterministic" which is formant preserving.
        // But for "Chipmunk" support:
        const useChipmunk = false; // TODO: pipe from request

        // Output pointer
        for (let i = 0; i < outData.length; i++) {
             // 1. Determine Frame Index
             const frameIdx = Math.floor(i / hop);
             if (frameIdx >= frames) break;

             // 2. Unvoiced Bypass
             const isVoiced = voicing.voicedQ[frameIdx] > 0;
             if (!isVoiced) {
                 outData[i] = inData[i]; // TODO: Crossfade
                 continue;
             }

             // 3. Calculate Target Pitch
             const targetCents = target.targetCentsQ[frameIdx]; 
             let inputF0Mhz = f0Track.f0MhzQ[frameIdx];
             if (inputF0Mhz <= 0) inputF0Mhz = 100000; 

             const strength = envelope.strengthQ[frameIdx] / 10000;
             
             const inputHz = inputF0Mhz / 1000;
             const inputCents = 69000 + 12000 * Math.log2(inputHz / 440);
             
             const desiredCents = inputCents + (targetCents/10 - inputCents) * strength;
             const shiftCents = (desiredCents - inputCents);
             const ratio = Math.pow(2, shiftCents / 1200);

             // 4. PSOLA-lite Grain Trigger
             const outputF0 = inputHz * ratio;
             
             phase += outputF0 / sr;
             
             if (phase >= 1) {
                 phase -= 1;
                 
                 // Grain Length Strategy
                 // Preserve Formants: Length = 2 * InputPeriod
                 // Shift Formants (Chipmunk): Length = 2 * OutputPeriod
                 const pBase = useChipmunk ? (sr / outputF0) : (sr / inputHz);
                 const grainLen = Math.floor(2 * pBase);
                 
                 const overlapGain = inputHz / outputF0; // Simple density comp

                 for (let k = 0; k < grainLen; k++) {
                     const pos = i - Math.floor(grainLen/2) + k;
                     if (pos >= 0 && pos < outData.length && pos < inData.length) {
                         const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * k / grainLen);
                         outData[pos] += inData[pos] * w * overlapGain; 
                     }
                 }
             }
        }
        
        // 5. Formant / Artifact Guard
        const result: AudioBufferV1 = { ...audio, data: [outData] };
        const guarded = await this.formantStrategy.apply(result, audio);

        return guarded;
    }
}


function floor(x: number) { return Math.floor(x); }
