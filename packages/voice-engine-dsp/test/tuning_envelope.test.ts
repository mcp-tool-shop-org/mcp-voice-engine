import { CorrectionController } from "../src/tuning/CorrectionController.js";
import { TunePlanV1, F0TrackV1, VoicingMaskV1, TargetCurveV1 } from "@mcptoolshop/voice-engine-core";

console.log("Running Correction Envelope Tests...");

function mockInputs(length: number, hz: number, targetHz: number, conf: number = 1.0) {
    const f0MhzQ = new Int32Array(length).fill(hz * 1000);
    const confQ = new Int16Array(length).fill(conf * 10000);
    const f0: F0TrackV1 = { 
        sampleRateHz: 48000, frameHz: 100, hopSamples: 480, t0Samples: 0, f0MhzQ, confQ 
    };
    
    const voicing: VoicingMaskV1 = {
        sampleRateHz: 48000, frameHz: 100, hopSamples: 480, t0Samples: 0,
        voicedQ: new Uint8Array(length).fill(1),
        voicingProbQ: new Int16Array(length).fill(10000)
    };

    // Calculate target cents
    const tCents = 6900 + 1200 * Math.log2(targetHz / 440);
    const targetQ = new Int32Array(length).fill(Math.round(tCents * 1000)); // Q format (Milli-Cents)

    const target: TargetCurveV1 = {
        sampleRateHz: 48000, frameHz: 100, hopSamples: 480, t0Samples: 0,
        targetCentsQ: targetQ
    };

    return { f0, voicing, target };
}

const controller = new CorrectionController();

const defaults: TunePlanV1 = {
    mode: "scale",
    scaleConfig: { key: "C", scale: "chromatic", allowedPitchClasses: [], referenceHz: 440 },
    parameters: {
        snapStrengthQ: 10000, // 100%
        glideMsQ: 0,
        retuneSpeedQ: 10000, // Instant
        consonantProtectionQ: 0
    },
    meta: { resolverVersion: "test", timestamp: 0 }
};

// Test 1: Instant Correction (Speed 100%)
// Input 400, Target 440. Strength should be 100% (10000).
const t1 = mockInputs(10, 400, 440);
const c1 = controller.generate(t1.f0, t1.voicing, t1.target, defaults);
if (c1.strengthQ[5] < 9900) throw new Error(`Test 1 Failed: Instant Strength ${c1.strengthQ[5]}`);
console.log("✅ Instant Correction Verified");

// Test 2: Slow Retune (Speed 1%)
// Input 400, Target 440. RawDiff = ~165 cents.
// Alpha small. smoothDiff starts small. Ratio small.
const slowPlan: TunePlanV1 = { ...defaults, parameters: { ...defaults.parameters, retuneSpeedQ: 500 } }; // 5%
const t2 = mockInputs(20, 400, 440);
const c2 = controller.generate(t2.f0, t2.voicing, t2.target, slowPlan);

// Frame 0: alpha * diff / diff = alpha. Strength ~ 5%. 500.
// Frame 10: Should increase.
if (c2.strengthQ[0] > 1000) throw new Error(`Test 2 Failed: Start should be slow. Got ${c2.strengthQ[0]}`);
if (c2.strengthQ[19] <= c2.strengthQ[0]) throw new Error("Test 2 Failed: Should ramp up");
console.log("✅ Slow Retune Ramp Verified");

// Test 3: Confidence Protection
// Input=Target (Diff 0). Wait, if Diff 0, ratio = 1.
// Let's use Diff. Input 400, Target 440.
// Protection 100%. Confidence 50%.
// Max Strength = 1.0 - 1.0 * (1.0 - 0.5) = 0.5.
// So result should be ~5000.
const protPlan: TunePlanV1 = { ...defaults, parameters: { ...defaults.parameters, consonantProtectionQ: 10000, snapStrengthQ: 10000 } };
const t3 = mockInputs(10, 400, 440, 0.5); // 50% conf
const c3 = controller.generate(t3.f0, t3.voicing, t3.target, protPlan);
// Speed is instant, so ratio=1.
// Base=1.
// Protection Limit = 0.5.
// Result = 5000.
if (Math.abs(c3.strengthQ[0] - 5000) > 100) throw new Error(`Test 3 Failed: Protection. Got ${c3.strengthQ[0]}`);
console.log("✅ Confidence Protection Verified");
