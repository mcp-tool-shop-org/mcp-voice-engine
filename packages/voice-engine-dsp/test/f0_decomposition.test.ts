import { F0Decomposer } from "../../voice-engine-core/src/prosody/F0Decomposer.js";
import { F0TrackV1 } from "../../voice-engine-core/src/schema/AnalysisV1.js";

// Manual assertion style (no vitest)
function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
}

function createFlatTrack(hz: number, frames: number): F0TrackV1 {
    return {
        sampleRateHz: 44100,
        frameHz: 100,
        hopSamples: 441,
        t0Samples: 0,
        f0MhzQ: new Int32Array(frames).fill(Math.round(hz * 1000)),
        confQ: new Int16Array(frames).fill(10000) // High confidence
    };
}

async function runTests() {
    console.log("Running F0 Decomposition Tests...");
    const decomposer = new F0Decomposer();

    // Test 1: Flat Line (DC)
    console.log("Test 1: Flat Constant Pitch (Checking Conservation)...");
    {
        const track = createFlatTrack(440, 100);
        const result = decomposer.decompose(track);

        const mid = 50;
        const macro = result.macro.valuesHz[mid];
        const micro = result.micro.valuesHz[mid];

        // Macro should be exactly the value (average of constant is constant)
        assert(Math.abs(macro - 440) < 0.1, `Expected macro ~440, got ${macro}`);
        
        // Micro should be 0
        assert(Math.abs(micro) < 0.1, `Expected micro ~0, got ${micro}`);
        console.log("PASS");
    }

    // Test 2: Vibrato Separation
    console.log("Test 2: Sine Wave Vibrato Separation...");
    {
        const frames = 200;
        const track = createFlatTrack(220, frames);
        
        // Add 5Hz vibrato, +/- 5Hz depth
        for (let i = 0; i < frames; i++) {
            const time = i / 100.0; // 100fps
            const vib = 5.0 * Math.sin(2 * Math.PI * 5 * time);
            track.f0MhzQ[i] = Math.round((220 + vib) * 1000);
        }

        // Use a window that covers at least one cycle (1/5 = 0.2s = 20 frames)
        // Default might be smaller, let's force a window if supported, or rely on default
        const result = decomposer.decompose(track);

        const mid = 100;
        const macro = result.macro.valuesHz[mid];
        const micro = result.micro.valuesHz[mid]; // Sin(5*1.0*2pi) = 0 usually, let's pick a peak
        
        // At 1.05s: 5 * 1.05 = 5.25 cycles. .25 * 2pi = pi/2 = 1. Peak.
        const peakIdx = 105; 
        const microPeak = result.micro.valuesHz[peakIdx];

        // Macro should stay near 220
        assert(Math.abs(macro - 220) < 1.0, `Expected macro stable ~220, got ${macro}`);
        
        // Micro should capture the vibrato (approx 5Hz amplitude)
        // Smoothing dampens peaks slightly, so we expect > 3Hz
        assert(Math.abs(microPeak) > 3.0, `Expected micro peak > 3Hz, got ${microPeak}`);
        
        console.log("PASS");
    }

    // Test 3: Unvoiced handling
    console.log("Test 3: Unvoiced Segments (Zero Handling)...");
    {
        const track = createFlatTrack(440, 50);
        // Middle is unvoiced/zero
        for(let i=20; i<30; i++) track.f0MhzQ[i] = 0;

        const result = decomposer.decompose(track);
        
        // Check unvoiced region
        assert(result.macro.valuesHz[25] === 0, "Expected macro 0 in unvoiced region");
        assert(result.micro.valuesHz[25] === 0, "Expected micro 0 in unvoiced region");
        
        // Check voiced edge conservation (simple check)
        assert(result.macro.valuesHz[10] > 400, "Expected voiced macro valid");
        
        console.log("PASS");
    }
}

runTests().catch(e => {
    console.error("FAILED:", e);
    process.exit(1);
});
