import { StreamingAutotuneEngine } from '../src/tuning/StreamingAutotuneEngine';
import { PROSODY_API_VERSION } from '../src/version';
import * as crypto from 'node:crypto';

// Diagnostic Tool for Phase 11.4

async function runDiagnostics() {
    console.warn("Starting Diagnostics Simulation...");

    // 1. Setup Input: Deterministic "Complex Harmonic"
    const sampleRate = 44100;
    const duration = 2; // seconds
    const totalSamples = sampleRate * duration;
    const inputBuffer = new Float32Array(totalSamples);
    
    // Base: 440Hz (A4) + harmonics
    for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        inputBuffer[i] = 
            0.5 * Math.sin(2 * Math.PI * 440 * t) +
            0.3 * Math.sin(2 * Math.PI * 880 * t) + 
            0.2 * Math.sin(2 * Math.PI * 1320 * t);
    }

    // 2. Setup Engine
    const config = {
        key: 'C',
        scale: 'major',
        hysteresis: 10
    };
    const preset = {}; 
    const engine = new StreamingAutotuneEngine(config, preset);

    // 3. Process Logic
    const processChunkSize = 1024;
    const collectedTargets: number[] = [];
    
    for (let i = 0; i < totalSamples; i += processChunkSize) {
        let chunk = inputBuffer.slice(i, i + processChunkSize);
        // Padding if needed (though slice is fine if < size at end)
        if (chunk.length < processChunkSize && chunk.length > 0) {
             const padded = new Float32Array(processChunkSize);
             padded.set(chunk);
             chunk = padded;
        }
        
        const result = engine.process(chunk);
        // result.targets is Float32Array
        if (result && result.targets) {
            for (let j = 0; j < result.targets.length; j++) {
                collectedTargets.push(result.targets[j]);
            }
        }
    }

    // 4. Hash Generation
    const targetsFloatArr = new Float32Array(collectedTargets);
    const bufferToHash = Buffer.from(targetsFloatArr.buffer);
    const hash = crypto.createHash('sha256').update(bufferToHash).digest('hex');

    // 5. Build Report
    const report = {
        version: PROSODY_API_VERSION,
        timestamp: new Date().toISOString(),
        config: config,
        determinismHash: hash,
        stateSnapshot: engine.snapshot() // Using the public snapshot method found
    };

    // 6. Output
    console.log(JSON.stringify(report, null, 2));
}

runDiagnostics().catch(err => {
    console.error("Diagnostics Failed:", err);
    process.exit(1);
});
