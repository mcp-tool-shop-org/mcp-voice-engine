import { strict as assert } from 'assert';
import { describe, it, expect } from 'vitest';
import { StreamingAutotuneEngine } from '../src/tuning/StreamingAutotuneEngine.js';

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
        assert(Math.abs(stable - 6900) < 50, `Expected ~6900, got ${stable}`);
        
        // Accent check
        const peakRegion = targets.slice(eventFrame - 15, eventFrame + 15);
        const maxVal = Math.max(...peakRegion);
        
        assert(maxVal > 6910, `Expected accent bump > 6910, got max ${maxVal}`);
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
        assert(val > 6800, `Middle should be voiced around 6900, got ${val}`);
        
        // Start should be unvoiced -> _lastOutputCents 0 (default)
        const startVal = targets[10];
        assert(startVal === 0, `Start should be 0, got ${startVal}`);
        
        // End should be last value held?
        const endVal = targets[targets.length - 1];
        assert(endVal > 6800, `Tail should hold last value or 0? Got ${endVal}`);
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
         assert(max1 > 6910, `Expected rise, got max ${max1}`);
         
         // Fall check
         const min2 = Math.min(...targets.slice(eventFrame2-10, eventFrame2+10));
         assert(min2 < 6890, `Expected fall, got min ${min2}`);
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
        assert(peakDelta < 40, `Expected compressed peak < 40 cents, got ${peakDelta.toFixed(1)}`);
        assert(peakDelta > 10, `Expected some accent > 10, got ${peakDelta.toFixed(1)}`);
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
            assert.equal(curr.length, baseline.length, `Length mismatch for size ${sizes[i]}. Base: ${baseline.length}, Curr: ${curr.length}`);
            for (let j = 0; j < curr.length; j++) {
                assert.equal(curr[j], baseline[j], `Mismatch at frame ${j} for size ${sizes[i]}`);
            }
        }
    });

});
