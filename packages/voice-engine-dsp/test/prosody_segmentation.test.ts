import { ProsodySegmenter } from "../../voice-engine-core/src/prosody/ProsodySegmenter";
import { F0TrackV1 } from "../../voice-engine-core/src/schema/AnalysisV1";
import { expect } from "expect"; // Assuming standard expect or just use manual throws if not available

// Manual assertion helper since we might not have a test runner setup perfectly
function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
}

async function runTests() {
    console.log("Running Prosody Segmentation Tests...");
    const segmenter = new ProsodySegmenter();

    // Test 1: Silence
    console.log("Test 1: Silence...");
    {
        const frames = 100;
        const f0Mock: any = {
            f0MhzQ: new Int32Array(frames).fill(0),
            confQ: new Int16Array(frames).fill(0),
            hopSamples: 100,
            t0Samples: 0,
            sampleRateHz: 16000
        };
        const audio = new Float32Array(frames * 100).fill(0);
        
        const segments = segmenter.segment(audio, f0Mock);
        assert(segments.length === 1, `Expected 1 segment, got ${segments.length}`);
        assert(segments[0].kind === "silence", `Expected silence, got ${segments[0].kind}`);
        console.log("PASS");
    }

    // Test 2: Voiced Pulse
    console.log("Test 2: Voiced Pulse...");
    {
        const frames = 100;
        const f0Mock: any = {
            f0MhzQ: new Int32Array(frames).fill(220000),
            confQ: new Int16Array(frames).fill(0),
            hopSamples: 100,
            t0Samples: 0,
            sampleRateHz: 16000
        };
        
        // Frames 30-70: High Confidence
        for(let i=30; i<70; i++) f0Mock.confQ[i] = 10000;

        // Corresponding Audio Energy
        const audio = new Float32Array(frames * 100).fill(0);
        for(let i=30 * 100; i<70 * 100; i++) audio[i] = 0.5; // High energy

        const result = segmenter.segment(audio, f0Mock);
        
        // Expect: Silence -> Unvoiced (maybe debounce) -> Voiced -> Silence
        // Check for Voiced segment in middle
        const voiced = result.find(s => s.kind === "voiced");
        assert(!!voiced, "No voiced segment found");
        
        if (voiced) {
            console.log(`Voiced span: ${voiced.startFrame} -> ${voiced.endFrame}`);
            assert(voiced.startFrame >= 30, "Voicng started too early");
            assert(voiced.endFrame <= 75, "Voicing ended too late"); // Allow hangover
        }
        console.log("PASS");
    }
}

runTests().catch(e => {
    console.error("Test Failed:", e);
    process.exit(1);
});
