import { bench, describe } from 'vitest';
import { StreamingAutotuneEngine } from '../src/tuning/StreamingAutotuneEngine.js';
import { generateSine } from './streaming_golden.test.js';

describe('Streaming Performance', () => {
    const sr = 44100;
    const duration = 10;
    const audio = generateSine(440, duration, sr);
    const defaultConfig = {
        allowedPitchClasses: [0, 2, 4, 5, 7, 9, 11],
        rootOffsetCents: 0,
        silenceThresholdDb: -50,
        voicingThresholdQ: 0.1,
    };
    
    bench('process 10s audio', () => {
        const engine = new StreamingAutotuneEngine(defaultConfig, {});
        // Process in one go or chunks? Real-time usually implies small chunks.
        // Let's use 1024 chunks to simulate overhead
        const chunkSize = 1024;
        for (let i = 0; i < audio.length; i += chunkSize) {
            const arr = audio.slice(i, i + chunkSize);
            engine.process(arr);
        }
    });
});
