import { TargetCurveGenerator } from "../src/tuning/TargetCurveGenerator.js";
import { TunePlanV1, F0TrackV1, VoicingMaskV1 } from "@mcptoolshop/voice-engine-core";

console.log("Running Target Curve Tests...");

function mockTracks(hzValues: number[]): { f0: F0TrackV1, voicing: VoicingMaskV1 } {
    const len = hzValues.length;
    const f0MhzQ = new Int32Array(len);
    const voicedQ = new Uint8Array(len);
    
    for(let i=0; i<len; i++) {
        f0MhzQ[i] = hzValues[i] * 1000;
        voicedQ[i] = (hzValues[i] > 0) ? 1 : 0;
    }

    return {
        f0: {
            sampleRateHz: 48000,
            frameHz: 100,
            hopSamples: 480,
            t0Samples: 0,
            f0MhzQ,
            confQ: new Int16Array(len).fill(10000)
        },
        voicing: {
            sampleRateHz: 48000,
            frameHz: 100,
            hopSamples: 480,
            t0Samples: 0,
            voicedQ,
            voicingProbQ: new Int16Array(len).fill(10000)
        }
    };
}

const generator = new TargetCurveGenerator();

// Plan: C Major
// A4 (6900) is in C Major (A=9). 0,2,4,5,7,9,11
const planCMaj: TunePlanV1 = {
    mode: "scale",
    scaleConfig: {
        key: "C",
        scale: "major",
        allowedPitchClasses: [0, 2, 4, 5, 7, 9, 11],
        referenceHz: 440
    },
    parameters: {
        snapStrengthQ: 10000,
        glideMsQ: 0, // Instant
        retuneSpeedQ: 10000,
        consonantProtectionQ: 0
    },
    meta: { resolverVersion: "test", timestamp: 0 }
};

// Test 1: Quantize A4 (In Scale)
const t1 = mockTracks([440, 440]);
const c1 = generator.generate(t1.f0, t1.voicing, planCMaj);
// 440 -> 6900 cents. Q -> 6900000 (Milli-Cents)
if (Math.abs(c1.targetCentsQ[0] - 6900000) > 500) throw new Error(`Test 1 Failed: ${c1.targetCentsQ[0]}`);
console.log("✅ Quantize In-Scale Verified");

// Test 2: Quantize A#4 (Out of Scale, 466.16Hz -> 7000 cents)
// A# is 7000. B is 7100. A is 6900.
// A# is equidistant? 7000. In C Major, A(9) and B(11) are allowed. A#(10) not.
// B is 7100. A is 6900. 7000 is strictly middle?
// 7000 -> 9 (A) dist 1. -> 11 (B) dist 1.
// Rounding in ScaleQuantizer? Math.round(70.0) -> 70.
// If input is exactly 7000.
// Implementations usually pick one.
// Let's test a bit closer to B. 480 Hz (~7050 cents).
const t2 = mockTracks([480]); 
// 480Hz -> 7050 cents. Nearest allowed is B (7100). A is 6900.
const c2 = generator.generate(t2.f0, t2.voicing, planCMaj);
if (Math.abs(c2.targetCentsQ[0] - 7100000) > 5000) throw new Error(`Test 2 Failed: Expected ~7100000, got ${c2.targetCentsQ[0]}`);
console.log("✅ Quantize Out-Scale Snap Verified");

// Test 3: Glide
const planGlide = { ...planCMaj, parameters: { ...planCMaj.parameters, glideMsQ: 100 } };
// Input: Jump from A4 (440) to B4 (493.88).
// Frame Hz = 100. dt = 10ms.
// Glide 100ms. Tau=100ms. alpha = 1 - exp(-10/100) = 1 - 0.9048 = 0.095.
// Step 1: 440. Target A4. Output A4.
// Step 2: 494. Target B4 (7100). Current A4 (6900).
// Output = 6900 + 0.095 * (7100 - 6900) = 6900 + 19 = 6919.
const t3 = mockTracks([440, 494, 494, 494]);
const c3 = generator.generate(t3.f0, t3.voicing, planGlide);
// Frame 0: 6900000
// Frame 1: ~6919000 
const f1 = c3.targetCentsQ[1];
if (f1 < 6910000 || f1 > 6930000) throw new Error(`Test 3 Failed: Glide didn't start correctly. Got ${f1}`);
console.log("✅ Glide Logic Verified");
