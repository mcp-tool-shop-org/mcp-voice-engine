import { describe, it, expect } from 'vitest';
import { StreamingAutotuneEngine } from '../src/tuning/StreamingAutotuneEngine';

describe('Performance Benchmark', () => {
    it('Meets RTF < 0.2 requirement', () => {
        const sampleRate = 44100;
        const totalSeconds = 10; // 10 seconds is enough for stable metric
        const totalSamples = totalSeconds * sampleRate;
        const bufferSize = 128; // Standard chunk
        
        // Setup minimal valid config
        const engine = new StreamingAutotuneEngine({
            rootOffsetCents: 0,
            hysteresisCents: 15,
            rampFrames: 5 // Ensure ramping logic runs
        }, {});
        
        const basePitch = 440;
        engine.setMockPitch(basePitch);
        
        // Mock Input: Sine wave
        const chunk = new Float32Array(bufferSize);
        for(let i=0; i<bufferSize; i++) chunk[i] = Math.sin(i * 0.1);
        
        const numChunks = Math.floor(totalSamples / bufferSize);
        
        // Warmup (optional, JIT)
        for(let i=0; i<100; i++) engine.process(chunk);

        // Track accumulated output complexity to ensure we aren't optimizing away the math
        let sumTargets = 0;
        let changedTargets = 0;
        let lastTarget = 0;

        const start = performance.now();
        
        // High load simulation: 
        // We'll queue some events to stress the ring buffer too
        // Check "Active" load, not just silent pass-through
        for(let i=0; i<numChunks; i++) {
             const currentFrame = i;
             
             // Inject Event every ~100 frames to force recalculation
             if (i % 100 === 0) {
                 engine.enqueueEvents([{ 
                     time: currentFrame + 5, 
                     duration: 20, 
                     strength: 50, // 50 cents up
                     shape: 'rise-fall'
                 }]);
             }

             // Vary pitch slightly to force Stabilizer/Quantizer logic
             engine.setMockPitch(basePitch + (i % 50)); 

             const res = engine.process(chunk);
             
             // Sanity Check Metric gathering
             for(let t=0; t<res.targets.length; t++) {
                 sumTargets += res.targets[t];
                 if (Math.abs(res.targets[t] - lastTarget) > 0.001) {
                     changedTargets++;
                 }
                 lastTarget = res.targets[t];
             }
        }
        
        const end = performance.now();
        const elapsedMs = end - start;
        const elapsedSeconds = elapsedMs / 1000;
        
        const rtf = elapsedSeconds / totalSeconds;
        console.log(`Benchmark: Processed ${totalSeconds}s audio in ${elapsedSeconds.toFixed(4)}s.`);
        console.log(`RTF: ${rtf.toFixed(4)} (Target < 0.2)`);
        
        // Sanity Check: Ensure the engine actually did something
        console.log(`Sanity: SumTargets=${sumTargets.toFixed(2)}, ChangedFrames=${changedTargets}`);
        
        // If ChangedFrames is 0, the engine was idle (holding constant pitch) the whole time.
        // With events and pitch jitter injected, this should be > 0.
        expect(changedTargets).toBeGreaterThan(0);
        
        expect(rtf).toBeLessThan(0.2);
    });
});

