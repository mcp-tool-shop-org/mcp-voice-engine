import { 
    AudioBufferV1, F0TrackV1, VoicingMaskV1, TuneScoreV1, TuneScoreScaleConfigV1
} from "@mcp-voice/core";
import { TargetCurveRefV1 } from "../src/tuning/TargetCurveRefV1.js";
import { CorrectionControllerRefV1 } from "../src/tuning/CorrectionControllerRefV1.js";

function createMockF0Track(length: number, f0Mhz: number): F0TrackV1 {
    return {
        sampleRateHz: 48000,
        frameHz: 100,
        hopSamples: 480,
        t0Samples: 0,
        f0MhzQ: new Int32Array(length).fill(f0Mhz),
        confQ: new Int16Array(length).fill(10000)
    };
}

function createMockVoicing(length: number, isVoiced: boolean): VoicingMaskV1 {
    return {
        sampleRateHz: 48000,
        frameHz: 100,
        hopSamples: 480,
        t0Samples: 0,
        voicedQ: new Uint8Array(length).fill(isVoiced ? 1 : 0),
        voicingProbQ: new Int16Array(length).fill(isVoiced ? 10000 : 0)
    };
}

console.log("Running Tuning Determinism Tests...");

// TEST 1: Stable Target (A4 Major Scale -> A4 Input)
{
    const numFrames = 50;
    const f0Track = createMockF0Track(numFrames, 440000); // 440Hz
    const voicing = createMockVoicing(numFrames, true);
    
    const score: TuneScoreScaleConfigV1 = {
        mode: "scale",
        key: "C",
        scale: "major",
        snapStrengthQ: 5000,
        glideMsQ: 0
    };

    const targetGen = new TargetCurveRefV1();
    const target = targetGen.generate(f0Track, voicing, score);

    // Expect: A4 (MIDI 69) = 69000 centsQ
    const midVal = target.targetCentsQ[25];
    console.log(`Test 1: A4 Input in C Major -> Target: ${midVal}`);
    
    if (midVal !== 69000) {
        console.error(`❌ Expected 69000, got ${midVal}`);
        process.exit(1);
    }
}

// TEST 2: Glide Logic (A4 -> B4 step)
{
    const numFrames = 50;
    const f0Track = createMockF0Track(numFrames, 440000); 
    // Second half B4 (MIDI 71) = ~493.88Hz = 493880 mHz
    for (let i = 25; i < numFrames; i++) {
        f0Track.f0MhzQ[i] = 493883; 
    }
    
    const voicing = createMockVoicing(numFrames, true);
    
    const score: TuneScoreScaleConfigV1 = {
        mode: "scale",
        key: "C",
        scale: "major",
        snapStrengthQ: 10000,
        glideMsQ: 100 // 100ms glide -> 10 frames at 100Hz
    };

    const targetGen = new TargetCurveRefV1();
    const target = targetGen.generate(f0Track, voicing, score);
    
    // Frame 24 should be 69000
    // Frame 25 (jump input) -> A4 to B4 (71000).
    // Glide starts.
    // Target 25 should be intermediate.
    const startVal = target.targetCentsQ[24];
    const endVal = target.targetCentsQ[49];
    
    console.log(`Test 2: Glide Start: ${startVal}, End: ${endVal}`);
    
    if (startVal !== 69000) {
        console.error(`❌ Expected start 69000, got ${startVal}`);
        process.exit(1);
    }
    
    if (Math.abs(endVal - 71000) > 250) { // Should be close to B4 (Exponential approach reaches ~90% in 2.5 tau)
        console.error(`❌ Expected end ~71000, got ${endVal}`);
        process.exit(1);
    }
    
    // Check intermediate
    const midGlide = target.targetCentsQ[26];
    if (midGlide <= 69000 || midGlide >= 71000) {
         console.error(`❌ Expected intermediate glide, got ${midGlide}`);
         process.exit(1);
    }
    console.log(`Test 2: Glide Intermediate (Frame 26): ${midGlide}`);
}

// TEST 3: Correction Envelope Erosion
{
    const numFrames = 20;
    const f0Track = createMockF0Track(numFrames, 440000);
    const voicing = createMockVoicing(numFrames, true);
    
    // Create unvoiced gap in middle: frames 8, 9, 10
    voicing.voicedQ[8] = 0;
    voicing.voicedQ[9] = 0;
    voicing.voicedQ[10] = 0;
    
    const score: TuneScoreScaleConfigV1 = {
        mode: "scale",
        key: "C",
        scale: "major",
        snapStrengthQ: 10000,
        glideMsQ: 0
    };

    const envGen = new CorrectionControllerRefV1();
    const env = envGen.generate(f0Track, voicing, score);
    
    // Frames 8,9,10 should be 0.
    // Frame 7 (dist 1) -> strength * 1/3 = 3333
    // Frame 6 (dist 2) -> strength * 2/3 = 6666
    // Frame 5 (dist 3) -> strength 10000
    
    console.log(`Test 3: Erosion [5,6,7,8]: ${env.strengthQ[5]}, ${env.strengthQ[6]}, ${env.strengthQ[7]}, ${env.strengthQ[8]}`);
    
    if (env.strengthQ[8] !== 0) process.exit(1);
    if (env.strengthQ[7] > 3400 || env.strengthQ[7] < 3200) {
         console.error("❌ Erosion failed at dist 1");
         process.exit(1);
    }
    if (env.strengthQ[6] > 6700 || env.strengthQ[6] < 6500) {
         console.error("❌ Erosion failed at dist 2");
         process.exit(1);
    }
}

console.log("✅ Tuning Determinism Verified");
