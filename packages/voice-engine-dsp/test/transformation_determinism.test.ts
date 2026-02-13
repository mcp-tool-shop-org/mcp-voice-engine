import { PitchShifterRefV1 } from "../src/transformation/PitchShifterRefV1.js";
import { PitchTrackerRefV1 } from "../src/analysis/PitchTrackerRefV1.js";
import { generateSine } from "./utils/SignalGenerator.js";
import { AudioBufferV1, F0TrackV1, VoicingMaskV1, TargetCurveV1, CorrectionEnvelopeV1 } from "@mcp-voice/core";

console.log("Running Audio Transformation Tests...");

function createBuffer(data: Float32Array): AudioBufferV1 {
    return {
        sampleRate: 48000,
        channels: 1,
        format: "f32",
        data: [data]
    };
}

function createMockTracks(
    lengthFrames: number,
    f0Mhz: number,
    targetCentsQ: number,
    isVoiced: boolean
) {
    const f0Track: F0TrackV1 = {
        sampleRateHz: 48000,
        frameHz: 100,
        hopSamples: 480,
        t0Samples: 0,
        f0MhzQ: new Int32Array(lengthFrames).fill(f0Mhz),
        confQ: new Int16Array(lengthFrames).fill(10000)
    };
    
    const voicing: VoicingMaskV1 = {
        sampleRateHz: 48000,
        frameHz: 100,
        hopSamples: 480,
        t0Samples: 0,
        voicedQ: new Uint8Array(lengthFrames).fill(isVoiced ? 1 : 0),
        voicingProbQ: new Int16Array(lengthFrames).fill(isVoiced ? 10000 : 0)
    };

    const target: TargetCurveV1 = {
        sampleRateHz: 48000,
        frameHz: 100,
        hopSamples: 480,
        t0Samples: 0,
        targetCentsQ: new Int32Array(lengthFrames).fill(targetCentsQ)
    };

    const envelope: CorrectionEnvelopeV1 = {
        sampleRateHz: 48000,
        frameHz: 100,
        hopSamples: 480,
        t0Samples: 0,
        strengthQ: new Int16Array(lengthFrames).fill(10000) // Full strength
    };

    return { f0Track, voicing, target, envelope };
}

// TEST 1: Octave Shift Up (440Hz -> 880Hz)
(async () => {
    const sr = 48000;
    const dur = 0.5; // 0.5s
    
    // Use Pulse Train instead of Sine for PSOLA stability
    // PSOLA works best on signals with clear epochs (like Glottal Pulses)
    // Sine wave lacks harmonics and can cause phase cancellation artifacts in naive PSOLA
    const numSamples = Math.floor(sr * dur);
    const complexWave = new Float32Array(numSamples);
    const period = sr / 440;
    for(let i=0; i<numSamples; i++) {
        // Band-limited Impulse or Approx Sawtooth
        // Simple Sawtooth: 1.0 - 2.0 * (phase % 1)
        const ph = (i / period) % 1;
        complexWave[i] = 1.0 - 2.0 * ph;
    }

    const buffer = createBuffer(complexWave);
    const numFrames = Math.ceil(buffer.data[0].length / 480);
    
    // Target: 880Hz
    // 440Hz ~ 6900 Cents -> 6900000 mCents
    // 880Hz ~ 8100 Cents -> 8100000 mCents
    const { f0Track, voicing, target, envelope } = createMockTracks(
        numFrames, 440000, 8100000, true
    );

    const shifter = new PitchShifterRefV1();
    const result = await shifter.shift(buffer, f0Track, voicing, target, envelope);
    
    // Check Clipping
    let maxAmp = 0;
    for (let s of result.data[0]) maxAmp = Math.max(maxAmp, Math.abs(s));
    console.log(`Test 1: Octave Up Max Amp: ${maxAmp}`);
    
    if (maxAmp > 1.0) {
        console.error("❌ Output Clipped!");
        process.exit(1);
    }
    
    // Analyze Result Pitch
    // We can't reuse f0Track config exactly because PitchTrackerRefV1 ctor signature changed in Phase 2?
    // Let's check constructor signature. 
    // PitchTrackerRefV1(config)
    const tracker = new PitchTrackerRefV1({
        windowMs: 40,
        hopMs: 10,
        f0Min: 50,
        f0Max: 1000
    });
    
    const outTrack = tracker.analyze(result);
    // Average F0 in middle
    const midFrame = Math.floor(outTrack.f0MhzQ.length / 2);
    const measuredMhz = outTrack.f0MhzQ[midFrame];
    const measuredHz = measuredMhz / 1000;
    
    console.log(`Test 1: Measured Output F0: ${measuredHz} Hz (Target 880)`);
    
    if (Math.abs(measuredHz - 880) > 50) { // Allow some error (PSOLA artifacting)
        console.error(`❌ Pitch Shift Failed! Expected ~880, got ${measuredHz}`);
        process.exit(1);
    }
    
    console.log("✅ Pitch Shift Up Verified");

    // TEST 2: Unvoiced Bypass
    // Use noise input, mark unvoiced. Target 880 (irrelevant)
    const noise = new Float32Array(48000 * 0.1);
    for(let i=0; i<noise.length; i++) noise[i] = (Math.random()*2 - 1) * 0.5;
    const bufferNoise = createBuffer(noise);
    const framesNoise = Math.ceil(noise.length / 480);
    
    const tracksUnvoiced = createMockTracks(framesNoise, 440000, 81000, false);
    
    const resNoise = await shifter.shift(bufferNoise, tracksUnvoiced.f0Track, tracksUnvoiced.voicing, tracksUnvoiced.target, tracksUnvoiced.envelope);
    
    // Should be identical to input (bypass)
    // Compare middle sample
    const idx = Math.floor(noise.length / 2);
    if (Math.abs(resNoise.data[0][idx] - noise[idx]) > 1e-5) {
        console.error("❌ Unvoiced Bypass Failed! Sample mismatch.");
        // console.log(resNoise.data[0][idx], noise[idx]);
        process.exit(1);
    }
    console.log("✅ Unvoiced Bypass Verified");

})();
