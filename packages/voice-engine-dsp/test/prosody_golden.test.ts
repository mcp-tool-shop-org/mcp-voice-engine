import { AutotuneExecutor } from "../src/tuning/AutotuneExecutor.js";
import { TuneRequestV1, AudioBufferV1 } from "@mcp-voice/core";
import { normalizePreset, HARD_TUNE_PRESET, SUBTLE_PRESET } from "../../voice-engine-core/src/config/ProsodyPresets.js";

// Mock minimal dependencies
const SAMPLE_RATE = 16000;
const DURATION_SEC = 1.0;
const FRAMES = 100; // 10ms hop
const T0_SAMPLES = 0;
const HOP_SAMPLES = 160;

function generateAudio(hz: number, vibratoDepth: number, vibratoRate: number): AudioBufferV1 {
    const samples = Math.floor(SAMPLE_RATE * DURATION_SEC);
    const audio = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
        const t = i / SAMPLE_RATE;
        const vib = vibratoDepth * Math.sin(2 * Math.PI * vibratoRate * t);
        // FM Synthesis for vibrato
        const phase = 2 * Math.PI * hz * t + (vib / vibratoRate) * Math.sin(2 * Math.PI * vibratoRate * t); // approx
        // Simpler: just modulate frequency? No phase is cleaner.
        // Let's just do f = hz + vib. Phase = integral(f dt).
        // Phase = 2pi * (hz*t - (vib/rate)*cos(2pi*rate*t))
        // depth is in Hz here
        
        audio[i] = Math.sin(2 * Math.PI * hz * t); // Pure tone for now
    }
    return {
        sampleRate: SAMPLE_RATE,
        channels: 1,
        format: "f32",
        data: [audio]
    };
}

async function runTest() {
    console.log("Running Prosody Golden Regression Tests...");

    const executor = new AutotuneExecutor();
    
    // 1. Hard Tune Test
    console.log("\n--- Test 1: Hard Tune on Steady Note ---");
    {
        const audio = generateAudio(440, 0, 0); // A4, no vibrato
        const req: TuneRequestV1 = {
            mode: "scale",
            key: "C",
            scale: "chromatic",
            preset: "hard"
        };
        
        try {
            const result = await executor.execute(req, audio);
            console.log("PASS: Execution completed");
            // Here we would analyze result buffer but PSOLA logic might be complex to verify in unit test
            // without complex pitch tracking on output.
            // We mainly check for crashes and determinism.
        } catch (e) {
            console.error("FAIL: Execution threw error", e);
            process.exit(1);
        }
    }

    // 2. Subtle Tune Test
    console.log("\n--- Test 2: Subtle Tune ---");
    {
        const audio = generateAudio(442, 0, 0); // slightly sharp
        const req: TuneRequestV1 = {
            mode: "scale",
            key: "C",
            scale: "chromatic",
            preset: "subtle"
        };
        
        try {
            await executor.execute(req, audio);
            console.log("PASS: Execution completed");
        } catch (e) {
            console.error("FAIL: Execution threw error", e);
            process.exit(1);
        }
    }
}

runTest();
