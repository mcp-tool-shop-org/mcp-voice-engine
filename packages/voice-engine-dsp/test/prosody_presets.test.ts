
import { normalizePreset, HARD_TUNE_PRESET, SUBTLE_PRESET, ProsodyPresetV1 } from '../../voice-engine-core/src/config/ProsodyPresets.js';
import { TargetStabilizer } from '../../voice-engine-core/src/prosody/TargetStabilizer.js';
import { ProsodySegmentV1, TargetStabilizerConfigV1 } from '../../voice-engine-core/src/prosody/ProsodyV1.js';

console.log("Running Prosody Presets Tests...");

// Simplistic assertion helper
function assert(condition: boolean, msg: string) {
    if (!condition) {
        console.error(`❌ FAILED: ${msg}`);
        process.exit(1);
    }
    console.log(`✅ ${msg}`);
}

// Test 1: Normalization (clamping, defaults)
console.log("\n--- Test 1: Normalization ---");
{
    // Check defaults
    const empty = normalizePreset({});
    assert(empty.correctionStrength === 1.0, "Defaults correctionStrength to 1.0");
    assert(empty.attackMs === 20, "Defaults attackMs to 20");
    
    // Check clamping
    const clamped = normalizePreset({
        correctionStrength: -5,
        attackMs: -10,
        releaseMs: -50,
        stabilizer: { 
            hysteresisCents: -100,
            minHoldMs: -20
        }
    });
    
    assert(clamped.correctionStrength === 0, "Clamps correctionStrength min to 0");
    assert(clamped.attackMs === 0, "Clamps attackMs min to 0");
    assert(clamped.releaseMs === 0, "Clamps releaseMs min to 0");
    assert(clamped.stabilizer.hysteresisCents === 0, "Clamps hysteresisCents min to 0");
    assert(clamped.stabilizer.minHoldMs === 0, "Clamps minHoldMs min to 0");
}

// Test 2: Hard Tune vs Subtle Behavior
console.log("\n--- Test 2: Hard Tune vs Subtle Behavior ---");

// Helper to run simulation
function runSimulation(preset: ProsodyPresetV1, inputHz: Float32Array, label: string) {
    const stabilizer = new TargetStabilizer();
    
    // Create segments covering the whole input as 'voiced'
    const segments: ProsodySegmentV1[] = [{
        kind: "voiced",
        startFrame: 0,
        endFrame: inputHz.length
    }];
    
    // Config comes from preset
    const config = preset.stabilizer;
    
    // Run stabilization (using default 100Hz frame rate)
    return stabilizer.stabilize(inputHz, segments, config, 100);
}

// Data Generation
const frameRate = 100;
const durationSec = 2.0;
const numFrames = Math.floor(durationSec * frameRate);
const inputHz = new Float32Array(numFrames);

// Generate "wavering" input and a jump
// 0.0s - 1.0s: Wavering around A4 (440Hz). 
//              We want to test stability/hysteresis.
//              Amplitude +/- 20 cents. 
//              Hard Tune (Hysteresis 25) should be more stable than Subtle (Hysteresis 10) if we were near a boundary.
//              But centered on 440, both should ideally stick to 440 unless we push towards a neighbor.
// 1.0s - 2.0s: Jump to A#4 (approx 466.16Hz). 100 cents higher.
const baseHz = 440.0;
const jumpHz = 466.16; // A#4

for (let i = 0; i < numFrames; i++) {
    const t = i / frameRate;
    
    if (t < 1.0) {
        // Wavering
        // Using a value that pushes vaguely towards the edge but stays closer to center?
        // Actually, let's just test the RAMP speed as the primary differentiator for "Hard vs Subtle"
        // as detecting hysteresis strictly requires careful boundary setup.
        // We add some noise/waver just to simulate realistic input.
        const waverCents = 10 * Math.sin(2 * Math.PI * 4 * t); 
        inputHz[i] = baseHz * Math.pow(2, waverCents / 1200);
    } else {
        // Jump
        inputHz[i] = jumpHz;
    }
}

const hardResult = runSimulation(HARD_TUNE_PRESET, inputHz, "Hard Tune");
const subtleResult = runSimulation(SUBTLE_PRESET, inputHz, "Subtle");

// Analysis: Switch Ramp / Transition Slope
// The jump happens at t=1.0 (frame 100).
// We expect Hard Tune to transition abruptly (steep slope).
// We expect Subtle to transition gradually (shallow slope).

function getMaxSlope(targetCents: Float32Array, startFrame: number, endFrame: number): number {
    let maxDelta = 0;
    for (let i = startFrame; i < endFrame - 1; i++) {
        const delta = Math.abs(targetCents[i+1] - targetCents[i]);
        if (delta > maxDelta) maxDelta = delta;
    }
    return maxDelta;
}

// Window around the jump
const windowStart = 95;
const windowEnd = 120; // Allow 20 frames (200ms) for subtle ramp to complete? (Subtle ramp is 80ms)

const hardSlope = getMaxSlope(hardResult.targetCents, windowStart, windowEnd);
const subtleSlope = getMaxSlope(subtleResult.targetCents, windowStart, windowEnd);

console.log(`Hard Tune Max Slope: ${hardSlope.toFixed(2)} cents/frame`);
console.log(`Subtle Max Slope:    ${subtleSlope.toFixed(2)} cents/frame`);

// Assertions
// Hard Tune has switchRampMs = 10ms (1 frame @ 100Hz). 
// The jump is 100 cents. So we expect ~100 cents/frame.
// Subtle has switchRampMs = 80ms (8 frames).
// The jump is 100 cents. So we expect ~100/8 = 12.5 cents/frame.

assert(hardSlope > subtleSlope, "Hard Tune should have steeper transition slope than Subtle");
assert(hardSlope > 50, "Hard Tune slope should be high (fast switch)"); 
assert(subtleSlope < 50, "Subtle slope should be lower (smooth ramp)");

console.log("\nTests Completed Successfully.");
