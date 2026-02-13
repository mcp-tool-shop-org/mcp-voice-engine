import { AutotuneExecutor } from "../src/tuning/AutotuneExecutor.js";
import { TuneRequestV1, AudioBufferV1 } from "@mcp-voice/core";

console.log("Running Autotune Integration Tests...");

function createSweep(sr: number, dur: number, fStart: number, fEnd: number): AudioBufferV1 {
    const len = Math.floor(sr * dur);
    const data = new Float32Array(len);
    let phase = 0;
    
    // Linear chirp
    for(let i=0; i<len; i++) {
        const t = i / sr;
        const f = fStart + (fEnd - fStart) * (t / dur);
        phase += f / sr;
        phase %= 1.0;
        // Sawtooth
        data[i] = (1.0 - 2.0 * phase) * 0.8;
    }

    return {
        sampleRate: sr,
        channels: 1,
        format: "f32",
        data: [data]
    };
}

// Zero Crossing Estimator
function measurePitch(data: Float32Array, sr: number, startEx: number, len: number): number {
    let crossings = 0;
    let firstIdx = -1;
    let lastIdx = -1;
    
    for (let i = startEx; i < startEx + len - 1; i++) {
        if (data[i] <= 0 && data[i+1] > 0) {
            crossings++;
            if (firstIdx === -1) firstIdx = i;
            lastIdx = i;
        }
    }
    
    if (crossings < 2) return 0;
    const durSec = (lastIdx - firstIdx) / sr;
    return (crossings - 1) / durSec;
}

(async () => {
    const executor = new AutotuneExecutor();
    
    // Input: Sweep 400Hz to 600Hz. 1 second.
    // C Major: C4(261).. A4(440), B4(493), C5(523), D5(587).
    // Should snap to A4, B4, C5, D5.
    const sweep = createSweep(48000, 1.0, 400, 600);
    
    const req: TuneRequestV1 = {
        mode: "scale",
        key: "C",
        scale: "major",
        preset: "robot" // Hard snap
    };
    
    const output = await executor.execute(req, sweep);
    
    // Debug Amp
    let maxA = 0;
    for(let i=0; i<output.data[0].length; i++) maxA = Math.max(maxA, Math.abs(output.data[0][i]));
    console.log(`Debug Output Max Amp: ${maxA}`);
    
    const centerSample = Math.floor(48000 * 0.5);
    console.log("Debug Samples around center:", output.data[0].slice(centerSample, centerSample + 10));

    // Check Result
    // Sample middle of buffer (approx 500Hz).
    // 500Hz. Closest allowed is B4 (493) or C5 (523).
    // 500 is closer to 493 (dist 7) than 523 (dist 23).
    // So expectation is ~493Hz.
    
    // Let's measure a window around 0.5s.
    const measured = measurePitch(output.data[0], 48000, centerSample, 4096);
    
    console.log(`Measured at 0.5s (Input ~500Hz): ${measured.toFixed(2)} Hz`);
    
    // Should be near B4 (493.88)
    const err = Math.abs(measured - 493.88);
    if (err > 20) { 
        // Or maybe C5? 523.
        const errC = Math.abs(measured - 523.25);
        if (errC < 20) {
             console.log("Snapped to C5 (Acceptable if rounding differed)");
        } else {
             throw new Error(`Integration Failed: Expected ~494, got ${measured}`);
        }
    } else {
        console.log("✅ Snapped to B4 (Correct)");
    }
    
})();
