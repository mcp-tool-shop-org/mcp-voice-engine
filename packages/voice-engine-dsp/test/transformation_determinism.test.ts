import { PitchShifterRefV1 } from "../src/transformation/PitchShifterRefV1.js";
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

/**
 * Robust Zero-Crossing Pitch Estimator
 * Counts crossings in the middle 50% of the buffer to avoid transients.
 */
function measurePitchZeroCrossing(data: Float32Array, sr: number): number {
    const start = Math.floor(data.length * 0.25);
    const end = Math.floor(data.length * 0.75);
    
    let crossings = 0;
    let firstIdx = -1;
    let lastIdx = -1;
    
    // Simple sign check, robust to DC offset if signal is centered
    // We assume test signals are sine/sawtooth centered at 0
    for (let i = start; i < end - 1; i++) {
        if (data[i] <= 0 && data[i+1] > 0) { // Positive crossing
            crossings++;
            if (firstIdx === -1) firstIdx = i;
            lastIdx = i;
        }
    }
    
    if (crossings < 2) return 0;
    
    // duration in samples between first and last crossing
    const durationSamples = lastIdx - firstIdx;
    const durationSec = durationSamples / sr;
    
    // crossings - 1 periods occurred
    return (crossings - 1) / durationSec;
}

function centsError(measured: number, target: number): number {
    return 1200 * Math.log2(measured / target);
}

// TEST 1: Octave Shift Up (440Hz -> 880Hz)
(async () => {
    const sr = 48000;
    const dur = 0.5; // 0.5s
    // Use Sawtooth for PSOLA stability on Octave Shift (Sine fundamental cancels)
    const numSamples = Math.floor(sr * dur);
    const saw440 = new Float32Array(numSamples);
    const period = sr / 440;
    for(let i=0; i<numSamples; i++) {
        const ph = (i / period) % 1;
        saw440[i] = (1.0 - 2.0 * ph) * 0.8;
    }
    
    const buffer = createBuffer(saw440);
    const numFrames = Math.ceil(buffer.data[0].length / 480);
    
    // Target: 880Hz
    // 440Hz ~ 6900 Cents -> 6900000 mCents
    // 880Hz ~ 8100 Cents -> 8100000 mCents
    const targetHz = 880;
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
    
    // Measure Pitch
    const measuredHz = measurePitchZeroCrossing(result.data[0], sr);
    const diffCents = centsError(measuredHz, targetHz);
    
    console.log(`Test 1: Measured ${measuredHz.toFixed(2)} Hz (Target ${targetHz})`);
    console.log(`Test 1: Error ${diffCents.toFixed(2)} cents`);

    // Strict-ish check for "Lite" PSOLA (within 35 cents)
    if (Math.abs(diffCents) > 35) {
        console.error(`❌ Pitch Shift Failed! Error > 35 cents.`);
        process.exit(1);
    }
    
    console.log("✅ Pitch Shift Up Verified (Cents Tolerance)");

    // TEST 2: Unvoiced Bypass
    const noise = new Float32Array(48000 * 0.1);
    for(let i=0; i<noise.length; i++) noise[i] = (Math.random()*2 - 1) * 0.5;
    const bufferNoise = createBuffer(noise);
    const framesNoise = Math.ceil(noise.length / 480);
    
    const tracksUnvoiced = createMockTracks(framesNoise, 440000, 8100000, false);
    
    const resNoise = await shifter.shift(bufferNoise, tracksUnvoiced.f0Track, tracksUnvoiced.voicing, tracksUnvoiced.target, tracksUnvoiced.envelope);
    
    // Output should be identical to input (bypass)
    // Compare middle sample
    const idx = Math.floor(noise.length / 2);
    // Allow float error
    if (Math.abs(resNoise.data[0][idx] - noise[idx]) > 1e-5) {
        console.error("❌ Unvoiced Bypass Failed! Sample mismatch.");
        process.exit(1);
    }
    console.log("✅ Unvoiced Bypass Verified");

})();
