
import { describe, it, expect } from 'vitest';
import { StreamingAutotuneEngine } from '../src/tuning/StreamingAutotuneEngine';
import * as crypto from 'node:crypto';

describe('Determinism Matrix', () => {
    it('should produce a deterministic hash for Complex Harmonic input', () => {
        // 1. Generate Input: Fixed "Complex Harmonic" (sum of 3 sines)
        const sampleRate = 44100;
        const duration = 2; // seconds
        const totalSamples = sampleRate * duration;
        const inputBuffer = new Float32Array(totalSamples);
        
        // Frequencies matching a musical note ensures relevance, but fixed numbers ensure determinism.
        // Base: 440Hz (A4)
        for (let i = 0; i < totalSamples; i++) {
            const t = i / sampleRate;
            inputBuffer[i] = 
                0.5 * Math.sin(2 * Math.PI * 440 * t) +
                0.3 * Math.sin(2 * Math.PI * 880 * t) + 
                0.2 * Math.sin(2 * Math.PI * 1320 * t);
        }

        // 2. Setup Engine
        // Params: key: C, scale: major, hysteresis: 10
        const config = {
            key: 'C',
            scale: 'major',
            hysteresis: 10
        };
        const preset = {}; 
        const engine = new StreamingAutotuneEngine(config, preset);

        // 3. Process Logic
        // We feed data in chunks. The engine uses hopSize=128 internally for processing frames.
        // We'll feed 1024 sample chunks to simulate streaming.
        const processChunkSize = 1024;
        const collectedTargets: number[] = [];
        
        for (let i = 0; i < totalSamples; i += processChunkSize) {
            let chunk = inputBuffer.slice(i, i + processChunkSize);
            // Ensure full chunks if necessary, but slice returns available.
            // If the engine requires specific alignment, we might need padding, 
            // but standard process() usually handles arrays.
            
            const result = engine.process(chunk);
            // result.targets is Float32Array
            for (let j = 0; j < result.targets.length; j++) {
                collectedTargets.push(result.targets[j]);
            }
        }
        
        // 4. Hash Generation
        const targetsFloatArr = new Float32Array(collectedTargets);
        // Create a buffer from the array's underlying buffer
        // Note: Buffer.from(arrayBuffer) views the memory. 
        // To ensure consistent hashing of the *values*, we use the buffer bytes.
        // Endianness is platform dependent usually, but TypedArrays follow system endianness. 
        // For a determinism test on one machine/architecture (or assuming Little Endian mostly), this works.
        const bufferToHash = Buffer.from(targetsFloatArr.buffer);
        
        const hash = crypto.createHash('sha256').update(bufferToHash).digest('hex');
        
        console.log(`[DETERMINISM] Calculated Hash: ${hash}`);

        // 5. Assert
        // Starting with a placeholder. I will run this, get the hash, and update it.
        // Expected Hash confirmed from run.
        const EXPECTED_HASH = "9f72340b7428027e31fcdf03baf9fd382240cd7d4698a60177d859eb70d4c1a6"; 
        
        expect(hash).toBe(EXPECTED_HASH);
    });
});
