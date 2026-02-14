import { describe, it, expect } from 'vitest';
import { AccentRenderer } from '../src/prosody/AccentRenderer';
import { ProsodyEventV1 } from '../../../voice-engine-core/src/prosody/ProsodyV1';

const mockStyle = { 
    id: 'mock-style',
    accentMaxCents: 200, 
    accentSpanSeconds: 0.2, 
    eventStrengthScale: 1.0,
    boundaryMaxCents: 100,
    residualMix: 0,
    postFocusCompression: 0
};

describe('AccentRenderer', () => {
    it('renders a raised cosine accent correctly (rise)', () => {
        const totalFrames = 100;
        const events: ProsodyEventV1[] = [{
            type: 'accent',
            time: 50,
            duration: 20,
            strength: 1.0,
            shape: 'rise',
            spanFrames: 20
        }];
        
        const result = AccentRenderer.render(events, totalFrames, mockStyle);
        
        // Peak at center (d=0 -> cos(0)=1 -> 0.5*(2)=1)
        expect(result[50]).toBeCloseTo(1.0);
        
        // At boundaries (d=10 -> cos(pi)=-1 -> 0)
        expect(result[40]).toBeCloseTo(0);
        expect(result[60]).toBeCloseTo(0);
        
        // Outside
        expect(result[39]).toBe(0);
        expect(result[61]).toBe(0);
    });

    it('renders a fall accent (negative)', () => {
        const totalFrames = 100;
        const events: ProsodyEventV1[] = [{
            type: 'accent',
            time: 50,
            duration: 20,
            strength: 1.0,
            shape: 'fall',
            spanFrames: 20
        }];
        
        const result = AccentRenderer.render(events, totalFrames, mockStyle);
        expect(result[50]).toBeCloseTo(-1.0);
    });

    it('handles overlap of multiple events', () => {
        const totalFrames = 100;
        const events: ProsodyEventV1[] = [
            { type: 'accent', time: 50, duration: 20, strength: 1.0, shape: 'rise', spanFrames: 20 },
            { type: 'accent', time: 50, duration: 20, strength: 0.5, shape: 'rise', spanFrames: 20 }
        ];
        
        const result = AccentRenderer.render(events, totalFrames, mockStyle);
        // 1.0 + 0.5 = 1.5
        expect(result[50]).toBeCloseTo(1.5);
    });

    it('clamps to buffer boundaries', () => {
        const totalFrames = 20;
        // Event centered at 0, radius 5. Range [-5, 5].
        const events: ProsodyEventV1[] = [{
            type: 'accent',
            time: 0,
            duration: 10,
            strength: 1.0,
            shape: 'rise',
            spanFrames: 10
        }];
        
        const result = AccentRenderer.render(events, totalFrames, mockStyle);
        
        expect(result[0]).toBeCloseTo(1.0);
        expect(result[5]).toBeCloseTo(0);
        // Ensure no error and length is correct
        expect(result.length).toBe(totalFrames);
    });

    it('handles fall-rise shape as negative (same as fall based on requirements)', () => {
         const totalFrames = 100;
         const events: ProsodyEventV1[] = [{
             type: 'accent',
             time: 50,
             duration: 20,
             strength: 1.0,
             shape: 'fall-rise',
             spanFrames: 20
         }];
         
         const result = AccentRenderer.render(events, totalFrames, mockStyle);
         expect(result[50]).toBeCloseTo(-1.0);
    });

    it('handles rise-fall shape as positive (same as rise based on requirements)', () => {
         const totalFrames = 100;
         const events: ProsodyEventV1[] = [{
             type: 'accent',
             time: 50,
             duration: 20,
             strength: 1.0,
             shape: 'rise-fall',
             spanFrames: 20
         }];
         
         const result = AccentRenderer.render(events, totalFrames, mockStyle);
         expect(result[50]).toBeCloseTo(1.0);
    });
});
