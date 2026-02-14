
import { PhraseBaselineModel } from '../../voice-engine-core/src/prosody/PhraseBaselineModel';
import { ProsodySegmentV1 } from '../../voice-engine-core/src/prosody/ProsodyV1';

// Simple check function to avoid vitest dependency
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
        }
    };
}

console.log('Running PhraseBaselineModel Tests...');

// Test 1: Linear Declination
(() => {
    console.log('Test 1: Linear Declination (Perfect Fit)');
    const model = new PhraseBaselineModel();
    const count = 100;
    const centerF0 = new Float32Array(count);
    
    // Create a perfect 440 -> 400 Hz ramp
    // Slope = -40 / 100 = -0.4 Hz/frame
    for (let i = 0; i < count; i++) {
        centerF0[i] = 440 - (0.4 * i);
    }

    const segments: ProsodySegmentV1[] = [{
        kind: 'voiced',
        startFrame: 0,
        endFrame: count
    }];

    const result = model.analyze(segments, centerF0);

    // Baseline should match centerF0 exactly
    expect(result.baselineHz[0]).toBeCloseTo(440);
    expect(result.baselineHz[99]).toBeCloseTo(440 - 0.4 * 99);
    
    // Intent should be 0
    expect(result.intentHz[50]).toBeCloseTo(0);

    // Slope check
    // note: slope calculation is "per frame" not "per second" here unless we scale
    // In the code, x is frame index. So slope is Hz/frame.
    expect(result.slopes[0]).toBeCloseTo(-0.4);

    console.log('PASS');
})();

// Test 2: Declination + Melody
(() => {
    console.log('Test 2: Declination + Melody (Sine Wave)');
    const model = new PhraseBaselineModel();
    const count = 100;
    const centerF0 = new Float32Array(count);
    
    // Baseline: 200 Hz -> 150 Hz over 100 frames. slope = -0.5
    // Melody: 10 Hz sine wave
    for (let i = 0; i < count; i++) {
        const base = 200 - (0.5 * i);
        const melody = 10 * Math.sin(i * 0.2);
        centerF0[i] = base + melody;
    }

    const segments: ProsodySegmentV1[] = [{
        kind: 'voiced',
        startFrame: 0,
        endFrame: count
    }];

    const result = model.analyze(segments, centerF0);

    // The linear regression of (ax+b + sine) should approximate ax+b 
    // because sine averages to near 0 over periods.
    // However, it depends on if the sine wave frame count is a multiple of the period.
    // 100 frames * 0.2 rad/frame = 20 rad = ~3.18 cycles.
    // The fit won't be perfect but should be close close.

    const fitStart = result.baselineHz[0];
    const fitEnd = result.baselineHz[99];
    
    // Expect Start ~ 200, End ~ 150.5
    if (Math.abs(fitStart - 200) > 5) throw new Error(`Baseline start ${fitStart} too far from 200`);
    
    // Check intent recovery at a peak of sine
    // melody = 10 * sin(0.2*x). roughly x=8 -> 1.6 rad ~ 1.
    // just check that intent is roughly cyclical and large
    
    let maxUnexplained = 0;
    for(let i=0; i<count; i++) {
        maxUnexplained = Math.max(maxUnexplained, Math.abs(result.intentHz[i]));
    }
    // Amplitude is 10.
    if (maxUnexplained < 8) throw new Error(`Intent amplitude ${maxUnexplained} is too small (expected ~10)`);

    console.log('PASS');
})();


// Test 3: Multiple Segments
(() => {
    console.log('Test 3: Multiple Segments and Gaps');
    const model = new PhraseBaselineModel();
    const count = 200;
    const centerF0 = new Float32Array(count);

    // Segment 1: 0-50. Flat 400.
    for(let i=0; i<50; i++) centerF0[i] = 400;
    
    // Gap: 50-100. (0)
    for(let i=50; i<100; i++) centerF0[i] = 0;

    // Segment 2: 100-200. Rising 200 -> 300. (Slope +1)
    for(let i=100; i<200; i++) centerF0[i] = 200 + (1.0 * (i - 100));

    const segments: ProsodySegmentV1[] = [
        { kind: 'voiced', startFrame: 0, endFrame: 50 },
        { kind: 'silence', startFrame: 50, endFrame: 100 },
        { kind: 'voiced', startFrame: 100, endFrame: 200 }
    ];

    const result = model.analyze(segments, centerF0);

    // Segment 1 check
    expect(result.slopes[0]).toBeCloseTo(0);
    expect(result.baselineHz[25]).toBeCloseTo(400);

    // Gap check (should be untouched or consistent with input logic. Code says intent copies input for non-voiced)
    expect(result.baselineHz[75]).toBe(0); // init value 0
    
    // Segment 2 check
    expect(result.slopes[2]).toBeCloseTo(1.0);
    expect(result.baselineHz[100]).toBeCloseTo(200);

    console.log('PASS');
})();

console.log('All tests passed.');
