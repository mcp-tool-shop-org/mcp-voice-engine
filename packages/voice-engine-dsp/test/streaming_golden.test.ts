import { describe, it, expect } from 'vitest';
import { StreamingAutotuneEngine } from '../src/tuning/StreamingAutotuneEngine';

// Helper to generate sine wave
export function generateSine(freq: number, durationSec: number, sr = 44100): Float32Array {
    const len = Math.floor(durationSec * sr);
    const buf = new Float32Array(len);
    for (let i = 0; i < len; i++) {
        buf[i] = Math.sin(2 * Math.PI * freq * i / sr);
    }
    return buf;
}

export function generateSilence(durationSec: number, sr = 44100): Float32Array {
    return new Float32Array(Math.floor(durationSec * sr));
}

export function concat(...arrays: Float32Array[]): Float32Array {
    const totalLen = arrays.reduce((acc, a) => acc + a.length, 0);
    const res = new Float32Array(totalLen);
    let offset = 0;
    for (const a of arrays) {
        res.set(a, offset);
        offset += a.length;
    }
    return res;
}

function runStreaming(engine: StreamingAutotuneEngine, audio: Float32Array, chunkSize: number): number[] {
    const allTargets: number[] = [];
    for (let i = 0; i < audio.length; i += chunkSize) {
        let chunk = audio.slice(i, i + chunkSize);
        const res = engine.process(chunk);
        for(let j=0; j<res.targets.length; j++) {
            allTargets.push(res.targets[j]);
        }
    }
    return allTargets;
}

const defaultConfig = {
    allowedPitchClasses: [0, 2, 4, 5, 7, 9, 11], // C Major
    rootOffsetCents: 0,
    silenceThresholdDb: -50,
    voicingThresholdQ: 0.1, 
    voicedEnterFrames: 1,
    voicedExitFrames: 1,
    hysteresisCents: 15,
    minHoldFrames: 2,
    rampFrames: 2
};

describe('StreamingAutotuneEngine Golden Tests', () => {

    it('Test A: Locality', () => {
        const engine = new StreamingAutotuneEngine(defaultConfig, {});
        engine.setMockPitch(440); // Mock 440Hz input
        
        // 1 second of A4 (440Hz -> 6900 cents)
        const audio = generateSine(440, 1.0);
        
        // Inject accent at 0.5 sec
        const eventFrame = Math.floor(0.5 * 44100 / 128);
        engine.enqueueEvents([{
            time: eventFrame,
            duration: 20, // frames
            strength: 50, // cents
            shape: 'rise'
        }]);
    
        const targets = runStreaming(engine, audio, 1024);
        
        // Stable region check
        const stable = targets[100]; 
        expect(Math.abs(stable - 6900)).toBeLessThan(50);
        
        // Accent check
        const peakRegion = targets.slice(eventFrame - 15, eventFrame + 15);
        const maxVal = Math.max(...peakRegion);
        
        expect(maxVal).toBeGreaterThan(6910);
    });
    
    it('Test B: Boundaries', () => {
        const engine = new StreamingAutotuneEngine(defaultConfig, {});
        engine.setMockPitch(440);
        
        // Silence -> Tone -> Silence
        const audio = concat(
            generateSilence(0.2), 
            generateSine(440, 0.5), 
            generateSilence(0.2)
        );
        
        const targets = runStreaming(engine, audio, 1024);
        
        // Middle is voiced
        const middleFrame = Math.floor((0.2 + 0.25) * 44100 / 128);
        const val = targets[middleFrame];
        expect(val).toBeGreaterThan(6800);
        
        // Start should be unvoiced -> _lastOutputCents 0 (default)
        const startVal = targets[10];
        expect(startVal).toBe(0);
        
        // End should be last value held?
        const endVal = targets[targets.length - 1];
        expect(endVal).toBeGreaterThan(6800);
    });
    
    it('Test C: Events (Rise/Fall)', () => {
         const engine = new StreamingAutotuneEngine(defaultConfig, {});
         engine.setMockPitch(440);
         
         const audio = generateSine(440, 1.0);
         
         const eventFrame1 = Math.floor(0.3 * 44100 / 128);
         const eventFrame2 = Math.floor(0.7 * 44100 / 128);
         
         engine.enqueueEvents([
            { time: eventFrame1, duration: 20, strength: 50, shape: 'rise' },
            { time: eventFrame2, duration: 20, strength: 50, shape: 'fall' }
         ]);
         
         const targets = runStreaming(engine, audio, 512);
         
         // Rise check
         const max1 = Math.max(...targets.slice(eventFrame1-10, eventFrame1+10));
         expect(max1).toBeGreaterThan(6910);
         
         // Fall check
         const min2 = Math.min(...targets.slice(eventFrame2-10, eventFrame2+10));
         expect(min2).toBeLessThan(6890);
    });
    
    it('Test D: PFC (Compression)', () => {
        // Case 1: PFC Enabled (default 0.5 strength)
        const configPFC = { ...defaultConfig, pfcStrength: 0.5 };
        
        const engine = new StreamingAutotuneEngine(configPFC, {});
        engine.setMockPitch(440);
        const audio = generateSine(440, 0.5);
        
        const eventFrame = Math.floor(0.25 * 44100 / 128);
        
        engine.enqueueEvents([
            { time: eventFrame, duration: 20, strength: 50, shape: 'rise' }
        ]);
        
        const targets = runStreaming(engine, audio, 512);
    
        const peakRegion = targets.slice(eventFrame - 15, eventFrame + 15);
        const maxVal = Math.max(...peakRegion);
        const baseline = 6900;
        const peakDelta = maxVal - baseline;
        
        // Expected: 50 * (1 - 0.5) = 25.
        // Check if it is significantly less than 50.
        expect(peakDelta).toBeLessThan(40);
        expect(peakDelta).toBeGreaterThan(10);
    });
    
    it('Test E: Chunking', () => {
        const sizes = [128, 256, 512];
        const audio = generateSine(440, 0.5);
        const len = Math.floor(audio.length / 512) * 512;
        const trimmedAudio = audio.slice(0, len);
        
        const results: number[][] = [];
        
        for (const size of sizes) {
            const engine = new StreamingAutotuneEngine(defaultConfig, {});
            engine.setMockPitch(440);
            const res = runStreaming(engine, trimmedAudio, size);
            results.push(res);
        }
        
        const baseline = results[0]; // 128
        for (let i = 1; i < results.length; i++) {
            const curr = results[i];
            expect(curr.length).toBe(baseline.length);
            for (let j = 0; j < curr.length; j++) {
                expect(curr[j]).toBe(baseline[j]);
            }
        }
    });

});
