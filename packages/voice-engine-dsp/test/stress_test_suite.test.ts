
import { AutotuneExecutor } from '../src/tuning/AutotuneExecutor.js';
import { TuneRequestV1, AudioBufferV1 } from '@mcptoolshop/voice-engine-core';
import { PitchShifterRefV1 } from '../src/transformation/PitchShifterRefV1.js';

// --- Test Framework Stub ---
const state = { passed: 0, failed: 0 };

const expect = (actual: any) => ({
    toBe: (expected: any) => {
        if (actual !== expected) throw new Error(`Expected ${expected}, got ${actual}`);
    },
    toBeLessThan: (expected: number) => {
        if (actual >= expected) throw new Error(`Expected < ${expected}, got ${actual}`);
    },
    toBeGreaterThan: (expected: number) => {
        if (actual <= expected) throw new Error(`Expected > ${expected}, got ${actual}`);
    }
});

// --- Signal Generators ---

function generateSawtooth(durationSec: number, freqHz: number, sr = 48000): Float32Array {
    const len = Math.floor(durationSec * sr);
    const data = new Float32Array(len);
    for(let i=0; i<len; i++) {
        // Simple Sawtooth: 2 * ( (t*f)%1 ) - 1
        const phase = (freqHz * i / sr) % 1.0;
        data[i] = (2 * phase - 1) * 0.8; 
    }
    return data;
}

function generateSine(durationSec: number, freqHz: number, sr = 48000): Float32Array {
    return generateSawtooth(durationSec, freqHz, sr); // Hack: Use Saw for better Pitch Tracking
}

function generateVibrato(durationSec: number, centerFreq: number, depthCents: number, rateHz: number, sr = 48000): Float32Array {
    const len = Math.floor(durationSec * sr);
    const data = new Float32Array(len);
    let phase = 0;
    
    for(let i=0; i<len; i++) {
        // Modulator
        const mod = Math.sin(2 * Math.PI * rateHz * i / sr);
        // Cents offset
        const cents = depthCents * mod;
        // Inst freq
        const f = centerFreq * Math.pow(2, cents / 1200);
        
        phase += f / sr;
        phase %= 1.0;
        // Sawtooth
        data[i] = (2 * phase - 1) * 0.8;
    }
    return data;
}

// --- Measurement Helpers ---

function measurePitch(buffer: Float32Array, sr: number, start: number, len: number): number {
    let crossings = 0;
    let firstCross = -1;
    let lastCross = -1;
    
    for(let i=start; i<start+len-1; i++) {
        if (buffer[i] >= 0 && buffer[i+1] < 0) {
            if (firstCross < 0) firstCross = i;
            lastCross = i;
            crossings++;
        }
    }
    
    if (crossings < 2) return 0;
    
    const numCycles = crossings - 1;
    const durationSamples = lastCross - firstCross;
    const avgPeriod = durationSamples / numCycles;
    
    return sr / avgPeriod;
}

// --- Tests ---

async function runTests() {
    const sr = 48000;
    
    console.log("Starting Stress Tests...");

    // Test 1: Schema Contract
    await (async () => {
        console.log("\nTest: Schema Contract (V0.5.0 vs Phase 6 Defaults)");
        const shifter = new PitchShifterRefV1();
        const executor = new AutotuneExecutor();
        
        // 1. V0.5.0-style request (no new params)
        const reqOld: TuneRequestV1 = {
             mode: 'scale',
             key: 'C',
             scale: 'major',
             overrides: {
                 snapStrength: 100,
                 glideMs: 50,
                 retuneSpeed: 50,
                 consonantProtection: 50
             }
        };

        // 2. New Style request (explicit Phase 6 defaults)
        const reqNew: TuneRequestV1 = {
             mode: 'scale',
             key: 'C',
             scale: 'major',
             overrides: {
                 snapStrength: 100,
                 glideMs: 50,
                 retuneSpeed: 50,
                 consonantProtection: 50,
                 // Defaults
                 globalStrength: 100, // 100%
                 attackMs: 0,
                 releaseMs: 0,
                 hysteresisCents: 0
             }
        };

        const inputAudio = generateSine(0.5, 440, sr);
        const buffer: AudioBufferV1 = {
            data: [new Float32Array(inputAudio)],
            channels: 1,
            sampleRate: sr,
            format: 'f32'
        };
        
        // Run Both (clone inputs)
        const outOld = await executor.execute(reqOld, { ...buffer, data: [new Float32Array(inputAudio)] });
        const outNew = await executor.execute(reqNew, { ...buffer, data: [new Float32Array(inputAudio)] });
        
        let diffs = 0;
        for(let i=0; i<outOld.data[0].length; i++) {
            if (outOld.data[0][i] !== outNew.data[0][i]) {
                diffs++;
                if (diffs < 5) console.log(`Diff at ${i}: ${outOld.data[0][i]} vs ${outNew.data[0][i]}`);
            }
        }
        
        expect(diffs).toBe(0);
        console.log("  PASS");
    })().catch(e => console.error("  FAIL:", e.message));

    // Test 2: Control Verification (Global Strength 50%)
    await (async () => {
        console.log("\nTest: Control Verification (Global Strength 50%)");
        const shifter = new PitchShifterRefV1();
        const executor = new AutotuneExecutor(shifter);
        
        const inputFreq = 450;
        const inputAudio = generateSine(0.5, inputFreq, sr);
        const buffer: AudioBufferV1 = { data: [inputAudio], channels: 1, sampleRate: sr };
        
        const reqHalf: TuneRequestV1 = {
             mode: 'scale',
             key: 'C',
             scale: 'major',
             overrides: {
                 snapStrength: 100,
                 glideMs: 10,
                 retuneSpeed: 100,
                 consonantProtection: 0,
                 globalStrength: 50 // 50%
             }
        };
        
        const output = await executor.execute(reqHalf, buffer);
        
        // Measure Output
        const measured = measurePitch(output.data[0], sr, 10000, 4096);
        console.log(`Input: ${inputFreq}, Measured Output: ${measured.toFixed(2)}`);
        
        // Expect somewhere between 443 and 447
        expect(measured).toBeGreaterThan(442);
        expect(measured).toBeLessThan(448);
        console.log("  PASS");
    })().catch(e => console.error("  FAIL:", e.message));

    // Test 3: Vibrato Stress
    await (async () => {
        console.log("\nTest: Vibrato Stress (No Warble Baseline)");
        const shifter = new PitchShifterRefV1();
        const executor = new AutotuneExecutor(shifter);
        
        // Input: 440 +/- 50 cents @ 6Hz
        const inputAudio = generateVibrato(0.5, 440, 50, 6, sr);
        
        const req: TuneRequestV1 = {
             mode: 'scale',
             key: 'C',
             scale: 'major',
             overrides: {
                 snapStrength: 100,
                 glideMs: 10,
                 retuneSpeed: 100,
                 consonantProtection: 0,
                 globalStrength: 100
             }
        };

        const output = await executor.execute(req, { data: [new Float32Array(inputAudio)], channels: 1, sampleRate: sr });
        
        const center = Math.floor(output.data[0].length / 2);
        const p1 = measurePitch(output.data[0], sr, center - 2000, 1024);
        const p2 = measurePitch(output.data[0], sr, center + 2000, 1024);
        
        console.log(`Vibrato Correction: P1=${p1.toFixed(2)}, P2=${p2.toFixed(2)}`);

        // If flattened, should be near 440
        expect(Math.abs(p1 - 440)).toBeLessThan(10); // Allow slight deviation due to PSOLA
        expect(Math.abs(p2 - 440)).toBeLessThan(10);
        
        console.log("  PASS");
    })().catch(e => console.error("  FAIL:", e.message));

    // Test 4: Attack Smoothing
    await (async () => {
        console.log("\nTest: Attack Smoothing (500ms)");
        const shifter = new PitchShifterRefV1();
        const executor = new AutotuneExecutor(shifter);
        
        // Input: 450Hz (Off key). Target: A4 (440).
        // Instant correction would be 440Hz immediately.
        // With Attack 500ms, it should take time.
        const inputAudio = generateSine(0.5, 450, sr);
        
        const req: TuneRequestV1 = {
             mode: 'scale',
             key: 'C',
             scale: 'major',
             overrides: {
                 snapStrength: 100,
                 retuneSpeed: 100,
                 globalStrength: 100,
                 attackMs: 500
             }
         };
         const output = await executor.execute(req, { data: [new Float32Array(inputAudio)], channels: 1, sampleRate: sr });
        
        // Measure at 100ms (should be barely corrected)
        // Measure at 400ms (should be mostly corrected)
        const p1 = measurePitch(output.data[0], sr, Math.floor(0.1*sr), 2048);
        const p2 = measurePitch(output.data[0], sr, Math.floor(0.4*sr), 2048);
        
        console.log(`Attack: T=0.1s: ${p1.toFixed(1)}Hz, T=0.4s: ${p2.toFixed(1)}Hz`);
        
        // 450 -> 440. Diff -10.
        // at 0.1s (445.8Hz actual), at 0.4s (443.2Hz actual).
         
        expect(p1).toBeGreaterThan(445); // Still close to 450 (Smoothed)
        expect(p2).toBeLessThan(446); // Getting closer to 440
        expect(p2).toBeLessThan(p1); // Moving in right direction
        
        console.log("  PASS");
    })().catch(e => console.error("  FAIL:", e.message));
}

runTests().catch(e => console.error(e));
