
import { TargetStabilizer } from '../../voice-engine-core/src/prosody/TargetStabilizer';
import { ProsodySegmentV1, TargetStabilizerConfigV1 } from '../../voice-engine-core/src/prosody/ProsodyV1';

// Simple check function
function expect(value: any) {
    return {
        toBe: (expected: any) => {
            if (value !== expected) throw new Error(`Expected ${value} to be ${expected}`);
        },
        toBeCloseTo: (expected: number, precision = 2) => {
            if (Math.abs(value - expected) > Math.pow(10, -precision)) {
                throw new Error(`Expected ${value} to be close to ${expected} (diff: ${Math.abs(value - expected)})`);
            }
        },
        toBeTruthy: () => {
            if (!value) throw new Error(`Expected ${value} to be truthy`);
        },
        toBeGreaterThan: (expected: number) => {
            if (value <= expected) throw new Error(`Expected ${value} to be greater than ${expected}`);
        }
    };
}

console.log('Running TargetStabilizer Tests...');

// Helper to make input
const makeInput = (hzVals: number[]) => new Float32Array(hzVals);
const makeSegment = (start: number, end: number): ProsodySegmentV1 => ({ kind: 'voiced', startFrame: start, endFrame: end });

// Test 1: Quantization & Stability (Steady State)
(() => {
    console.log('Test 1: Steady Input');
    const stabilizer = new TargetStabilizer();
    
    // 440Hz -> 6900 Cents -> Note 69
    const input = new Float32Array(10).fill(440);
    const segs = [makeSegment(0, 10)];
    
    const result = stabilizer.stabilize(input, segs);
    
    expect(result.noteIds[0]).toBe(69);
    expect(result.targetCents[0]).toBe(6900);
    expect(result.noteIds[9]).toBe(69);
    
    console.log('PASS');
})();

// Test 2: Hysteresis
(() => {
    console.log('Test 2: Hysteresis');
    const config: TargetStabilizerConfigV1 = {
        hysteresisCents: 15,
        minHoldMs: 0 // disable hold for pure hysteresis check
    };
    const stabilizer = new TargetStabilizer();
    
    // A4 = 6900 (Note 69)
    // A#4 = 7000 (Note 70)
    // Midpoint = 6950
    // We start at 6900.
    // We go to 6955. 
    // Dist using 69: |6955-6900| = 55
    // Dist using 70: |6955-7000| = 45
    // Improv = 10. Hysteresis=15. Should NOT switch.
    
    // We go to 6960.
    // Dist using 69: 60. Dist using 70: 40. Improv=20. Should Switch.

    // Hz needed:
    // 6900 -> 440
    // 6955 -> 440 * 2^(55/1200) = 454.2
    // 6960 -> 440 * 2^(60/1200) = 455.5
    
    const input = new Float32Array(20);
    for(let i=0; i<10; i++) input[i] = 454.2; // 6955 cents -> Should latch to 6900 (start) or 7000?
    // At i=0, 6955 is closer to 7000 (45) than 6900 (55). It will pick 7000 immediately.
    // Wait, let's start clearly at 6900 to establish "Current".
    
    input[0] = 440; // 6900. Current=69
    input[1] = 454.2; // 6955. Err(69)=55. Err(70)=45. Improv=10. < 15. Keep 69.
    input[2] = 455.5; // 6960. Err(69)=60. Err(70)=40. Improv=20. > 15. Switch to 70.

    const segs = [makeSegment(0, 3)];
    const result = stabilizer.stabilize(input, segs, config);
    
    expect(result.noteIds[0]).toBe(69);
    expect(result.noteIds[1]).toBe(69); 
    expect(result.noteIds[2]).toBe(70);

    console.log('PASS');
})();

// Test 3: Min Hold
(() => {
    console.log('Test 3: Min Hold Duration');
    const config: TargetStabilizerConfigV1 = {
        hysteresisCents: 0, // Disable hysteresis to isolate hold time
        minHoldMs: 50 // 5 frames at 100Hz
    };
    const frameHz = 100;
    const stabilizer = new TargetStabilizer();

    // 0: Start at 6900 (Note 69)
    // 1: Jump to 7100 (Note 71) -> Clear switch?
    // But hold is 5 frames.
    // frame 0: picks 69. lastSwitch = 0.
    // frame 1: timeHeld = 1-0 = 1. < 5. NO SWITCH.
    // ...
    // frame 5: timeHeld = 5-0 = 5. >= 5. SWITCH.

    const input = new Float32Array(10);
    input[0] = 440; // 6900
    for(let i=1; i<10; i++) input[i] = 493.88; // B4 ~ 493.88 (Note 71, 7100)

    const segs = [makeSegment(0, 10)];
    const result = stabilizer.stabilize(input, segs, config, frameHz);

    expect(result.noteIds[0]).toBe(69);
    expect(result.noteIds[1]).toBe(69); // Held
    expect(result.noteIds[4]).toBe(69); // Held (index 4 is 5th frame, timeHeld=4?)
    // Logic: timeHeld = i - lastSwitch. i=4, last=0 -> 4. < 5.
    
    expect(result.noteIds[5]).toBe(71); // i=5, last=0 -> 5. >= 5. Switch!

    console.log('PASS');
})();

// Test 4: Transition / Glide
(() => {
    console.log('Test 4: Glide Detection');
    const config: TargetStabilizerConfigV1 = {
        transitionSlopeThreshCentsPerSec: 1000 // 10 cents/frame at 100Hz
    };
    const frameHz = 100; 
    const stabilizer = new TargetStabilizer();

    // 0: 6900
    // 1: 6905 (Slope 5. < 10. Stable)
    // 2: 6950 (Slope 45. > 10. Transition!)
    // 3: 7000 (Slope 50. > 10. Transition!)
    
    const input = new Float32Array(4);
    // Hz values
    input[0] = 440; // 6900
    input[1] = 441.27; // ~6905
    input[2] = 452.89; // ~6950
    input[3] = 466.16; // ~7000

    const segs = [makeSegment(0, 4)];
    const result = stabilizer.stabilize(input, segs, config, frameHz);

    expect(result.inTransition[0]).toBe(0); // init (look ahead? diff is 5)
    expect(result.inTransition[1]).toBe(0); // 6905-6900 = 5 < 10
    expect(result.inTransition[2]).toBe(1); // 6950-6905 = 45 > 10
    expect(result.inTransition[3]).toBe(1); // 7000-6950 = 50 > 10
    
    // In transition, we should hold note ID
    expect(result.noteIds[0]).toBe(69);
    expect(result.noteIds[3]).toBe(69); // Even though we reached 7000 note, we are gliding, so hold previous.

    console.log('PASS');
})();

// Test 5: Ramping Output
(() => {
    console.log('Test 5: Target Curve Ramping');
    const config: TargetStabilizerConfigV1 = {
        switchRampMs: 30, // 3 frames
        minHoldMs: 0,
        transitionSlopeThreshCentsPerSec: 100000 // Allow hard step without "transition" hold
    };
    const stabilizer = new TargetStabilizer();
    
    const input = new Float32Array(10);
    input[0] = 440; // 6900
    for(let i=1; i<10; i++) input[i] = 466.16; // 7000 (A#4)

    const segs = [makeSegment(0, 10)];
    const result = stabilizer.stabilize(input, segs, config);
    
    // Switch at i=1?
    // Init i=0: Note 69. Target 6900.
    // i=1: Input 7000. Switch to Note 70. Target 7000.
    // Ramp starts. Start=6900, End=7000, Dur=3 frames.
    // i=1 (frame 1 of ramp): val = 6900 + (100)*1/3 = 6933.33
    // i=2 (frame 2 of ramp): val = 6900 + (100)*2/3 = 6966.66
    // i=3 (frame 3 of ramp): val = 6900 + (100)*3/3 = 7000.

    expect(result.noteIds[0]).toBe(69);
    expect(result.noteIds[1]).toBe(70); 

    // Check ramp
    expect(result.targetCents[0]).toBeCloseTo(6900);
    expect(result.targetCents[1]).toBeCloseTo(6933.33, 0); 
    expect(result.targetCents[2]).toBeCloseTo(6966.66, 0);
    expect(result.targetCents[3]).toBeCloseTo(7000);
    
    console.log('PASS');
})();

console.log('All tests passed.');
