import { ProsodySegmenter, SegmentationOptions, SegmentKind } from '../../src/segmentation/ProsodySegmenter';
// Mock F0TrackV1 locally to avoid import issues in test environment or import from same place
import { F0TrackV1 } from '../../packages/voice-engine-core/src/schema/AnalysisV1'; // Adjusted path if needed

describe('ProsodySegmenter', () => {
    it('should segment audio into silence, unvoiced, and voiced regions with hysteresis', () => {
        const hopSamples = 100;
        const sampleRateHz = 16000;
        const numFrames = 40;
        
        // Setup Audio Buffer
        const audio = new Float32Array(numFrames * hopSamples);
        
        // Helper to fill audio
        const fillAudio = (startFrame: number, count: number, amplitude: number) => {
            for (let i = startFrame * hopSamples; i < (startFrame + count) * hopSamples; i++) {
                 // Random noise for simple RMS
                audio[i] = (Math.random() * 2 - 1) * amplitude;
            }
        };

        // 1. Silence (Frames 0-9) - Amp 0
        fillAudio(0, 10, 0.0);

        // 2. Unvoiced Speech (Frames 10-19) - Amp high (-30dB approx), Conf low
        // -30dB amplitude approx 0.03
        fillAudio(10, 10, 0.05);

        // 3. Voiced Speech (Frames 20-29) - Amp high (-30dB), Conf high
        fillAudio(20, 10, 0.05);

        // 4. Hysteresis Region (Frames 30-34) - Amp medium (-45dB), Conf low
        // Should stay in speech state because it was speech, and -45 > -50 (stop thresh)
        // -45dB amplitude approx 0.005
        fillAudio(30, 5, 0.006);

        // 5. Silence again (Frames 35-39) - Amp very low (-60dB) < -50
        fillAudio(35, 5, 0.0001);

        // Setup F0 Track
        const f0Track: F0TrackV1 = {
            sampleRateHz,
            frameHz: sampleRateHz / hopSamples,
            hopSamples,
            t0Samples: hopSamples / 2, // Center of first frame
            f0MhzQ: new Int32Array(numFrames),
            confQ: new Int16Array(numFrames)
        };

        // Set Confidence
        // Frames 0-19: Low Conf
        // Frames 20-29: High Conf (Voiced)
        // Frames 30-39: Low Conf
        
        const voicingThresh = 5000;

        for (let i = 0; i < numFrames; i++) {
            if (i >= 20 && i < 30) {
                f0Track.confQ[i] = 8000; // Voiced
            } else {
                f0Track.confQ[i] = 1000; // Unvoiced/Silence
            }
        }

        const options: SegmentationOptions = {
            speechStartThresholdDb: -40, // High threshold
            speechStopThresholdDb: -50,  // Low threshold
            voicingThreshold: voicingThresh
        };

        // Execute
        const segments = ProsodySegmenter.segment(f0Track, audio, options);

        // Validate
        // Predicted Segments:
        // 0-9: Silence
        // 10-19: Unvoiced (Energy > -40, Conf < 5000)
        // 20-29: Voiced (Energy > -40, Conf > 5000)
        // 30-34: Unvoiced (Energy approx -45. -50 < -45 < -40. Hysteresis holds speech state. Conf low -> Unvoiced)
        // 35-39: Silence (Energy < -50)

        // Expected Merged Segments:
        // 1. Silence [0, 10)
        // 2. Unvoiced [10, 20)
        // 3. Voiced [20, 30)
        // 4. Unvoiced [30, 35) -> Note: These are adjacent Unvoiced regions if implemented separately, 
        //    but merged if standard merge runs.
        //    Wait, 10-20 is Unvoiced. 20-30 is Voiced. 30-35 is Unvoiced.
        //    So: Silence, Unvoiced, Voiced, Unvoiced, Silence.

        expect(segments.length).toBe(5);
        
        expect(segments[0].kind).toBe('silence');
        expect(segments[0].startFrame).toBe(0);
        expect(segments[0].endFrame).toBe(10);

        expect(segments[1].kind).toBe('unvoiced');
        expect(segments[1].startFrame).toBe(10);
        expect(segments[1].endFrame).toBe(20);

        expect(segments[2].kind).toBe('voiced');
        expect(segments[2].startFrame).toBe(20);
        expect(segments[2].endFrame).toBe(30);

        expect(segments[3].kind).toBe('unvoiced'); // Hysteresis kicked in here
        expect(segments[3].startFrame).toBe(30);
        expect(segments[3].endFrame).toBe(35);

        expect(segments[4].kind).toBe('silence');
        expect(segments[4].startFrame).toBe(35);
        expect(segments[4].endFrame).toBe(40);
    });
});
