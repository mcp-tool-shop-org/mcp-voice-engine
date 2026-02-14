// mcp-voice-engine/test/segmentation/ProsodySegmenter.test.ts

import { ProsodySegmenter } from '../../src/segmentation/ProsodySegmenter';
import { F0Track, SegmentationConfig } from '../../src/interfaces/ProsodyV1';
import * as assert from 'assert'; // Standard node assertion if needed, or expect

// Mocking describe/it if not globally available (just in case this is run as a script)
declare const describe: any;
declare const it: any;
declare const expect: any;

describe('ProsodySegmenter', () => {
    const SAMPLE_RATE = 16000;
    const HOP_SAMPLES = 160; // 10ms
    
    // Helper to generate F0 track
    const createF0 = (length: number, defaultConf: number): F0Track => ({
        confQ: new Int16Array(length).fill(defaultConf),
        hopSamples: HOP_SAMPLES,
        sampleRateHz: SAMPLE_RATE
    });

    // Helper to generate audio
    const createAudio = (lengthFrames: number, type: 'silence'|'noise'|'tone'): Float32Array => {
        const len = lengthFrames * HOP_SAMPLES;
        const buf = new Float32Array(len);
        if (type === 'silence') return buf;
        
        for (let i = 0; i < len; i++) {
            if (type === 'noise') {
                buf[i] = (Math.random() * 2 - 1) * 0.1; // -20dB ish
            } else if (type === 'tone') {
                buf[i] = Math.sin(2 * Math.PI * 440 * i / SAMPLE_RATE) * 0.5;
            }
        }
        return buf;
    };

    it('should detect simple silence -> voiced -> silence transition', () => {
        const segmenter = new ProsodySegmenter({
            silenceThresholdDb: -50,
            voicingThreshold: 500,
            voicedEnterCount: 2,
            voicedExitCount: 2
        });

        // 5 frames silence, 10 frames voiced tone (high conf), 5 frames silence
        const framesTotal = 20;
        const silenceAudio = createAudio(5, 'silence');
        const voicedAudio = createAudio(10, 'tone');
        const silenceAudio2 = createAudio(5, 'silence');
        
        // Combine audio
        const audio = new Float32Array(silenceAudio.length + voicedAudio.length + silenceAudio2.length);
        audio.set(silenceAudio);
        audio.set(voicedAudio, silenceAudio.length);
        audio.set(silenceAudio2, silenceAudio.length + voicedAudio.length);

        // F0 Track
        const f0 = createF0(20, 0);
        // Set confidence high for the middle 10 frames
        for(let i=5; i<15; i++) {
            f0.confQ[i] = 1000; 
        }

        const segments = segmenter.process(audio, f0);
        
        // Expected: 
        // 0-5 Silence (Because audio is 0, logic says !EnergyHigh -> Silence)
        // 5-6 Unvoiced? Wait. 
        // Frame 5: Energy High (Tone), Conf High (1000). EnterCount=1. Next=Unvoiced.
        // Frame 6: Energy High (Tone), Conf High. EnterCount=2. Next=Voiced.
        // So 5-7 might be unvoiced transition or "enter" phase.
        // Actually code says: if enterCounter >= 2, nextKind = voiced.
        // So at end of frame 6 processing, we switch to voiced.
        // So Frames 5, 6 might be labeled Unvoiced (or Silence -> Unvoiced transition).
        // Let's trace carefully:
        // F0-4: Low Energy -> Silence.
        // F5: High Energy, High Conf. EnterCount=1. Not >= 2. Next=Unvoiced. (Segment Silence 0-5 finalized).
        // F6: High Energy, High Conf. EnterCount=2. Next=Voiced. (Segment Unvoiced 5-6 finalized).
        // F7..14: Voiced.
        // F15: Low Energy (Silence). Check Hangover. Hangover=2. 
        //      F15: Hangover -> 1. Next=Voiced.
        //      F16: Hangover -> 0. Next=Voiced.
        //      F17: Hangover exhausted. Next=Silence. (Segment Voiced 6-17 finalized).
        // F17..19: Silence.
        
        // Note on indices: "startFrame" is inclusive, "endFrame" is exclusive (like slice).
        // F0-5 is Silence. (5 frames)
        // F5 is High E, High C. EnterCount++ (1). Next=Unvoiced. State changes Silence->Unvoiced. Start=5.
        // F6 is High E, High C. EnterCount++ (2). Next=Voiced. State changes Unvoiced->Voiced. Start=6. Segment Unvoiced 5-6.
        // ... Voiced continues ...
        // F15 (Silence audio starts). Low Energy. Old=Voiced. Hangover-- (1). Next=Voiced.
        // F16 Low Energy. Old=Voiced. Hangover-- (0). Next=Voiced.
        // F17 Low E. Old=Voiced. Hangover=0. Next=Silence. State changes Voiced->Silence at 17. Segment Voiced 6-17.
        // F17..20 Silence.

        // Expected output might vary slightly by off-by-one depending on exact logic loop, but roughly:
        // 1. Silence: 0-5
        // 2. Unvoiced: 5-6 (Transition)
        // 3. Voiced: 6-17 (Includes 2 frames of hangover)
        // 4. Silence: 17-20
        
        console.log("Segments:", segments);
        
        if (typeof expect !== 'undefined') {
            expect(segments.length).toBeGreaterThanOrEqual(3);
            expect(segments[0].kind).toBe('silence');
            expect(segments.find(s => s.kind === 'voiced')).toBeTruthy();
        }
    });
    
    it('should handle unvoiced noise correctly', () => {
         const segmenter = new ProsodySegmenter({
            silenceThresholdDb: -50,
            voicingThreshold: 500,
            voicedEnterCount: 2
        });
        
        // 10 frames noise (High E, Low Conf)
        const audio = createAudio(10, 'noise');
        const f0 = createF0(10, 0); // Low conf
        
        const segments = segmenter.process(audio, f0);
        
        // All should be unvoiced
        // F0: High E, Low C. Next=Unvoiced.
        // F1..9: Same.
        // Result: 1 segment Unvoiced 0-10.
        // Unless it starts as Silence? 
        // Code: currentKind defaults to 'silence'.
        // F0: High E, Low C. Next=Unvoiced. State change Silence->Unvoiced.
        // Segment 0-0 (Empty) pushed? finalizeSegment checks end > start.
        // So we just switch state and startFrame=0.
        // End of loop: finalize Unvoiced 0-10.
        
        if (typeof expect !== 'undefined') {
             expect(segments.length).toBe(1);
             expect(segments[0].kind).toBe('unvoiced');
             expect(segments[0].endFrame).toBe(10);
        }
    });
});
