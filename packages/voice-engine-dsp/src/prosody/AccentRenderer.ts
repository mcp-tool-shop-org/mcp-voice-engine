import { ProsodyEventV1, ProsodyStyleV1 } from "../../../voice-engine-core/src/prosody/ProsodyV1.js";

export class AccentRenderer {
    /**
     * Renders prosodic accents into a per-frame control curve.
     * Uses a raised cosine window for smooth parameter modulation.
     * 
     * @param events List of prosody events to render
     * @param totalFrames Total number of frames in the output buffer
     * @param style Prosody style configuration
     * @param frameRateHz Frame rate for time conversions (default 100)
     * @returns Float32Array of rendered values (additive relative cents)
     */
    static render(events: ProsodyEventV1[], totalFrames: number, style: ProsodyStyleV1, frameRateHz: number = 100): Float32Array {
        const output = new Float32Array(totalFrames);
        const { accentMaxCents, accentSpanSeconds, eventStrengthScale } = style;
        
        // Convert seconds to frames
        const defaultDurationFrames = Math.round(accentSpanSeconds * frameRateHz);

        for (const event of events) {
            // Only process accent events
            if (event.type !== 'accent') continue;

            const time = event.time;
            const strength = event.strength;
            const shape = event.shape || 'rise';
            
            // Use event duration if provided, else default from style
            let duration = event.spanFrames;
            if (!duration || duration <= 0) {
                 duration = defaultDurationFrames;
            }

            // Calculate peak cents: normalized strength * global scale * max cents
            const peakCents = strength * eventStrengthScale * accentMaxCents;
            
            const radius = duration / 2;

            // Determine range of frames to process
            const startFrame = Math.ceil(time - radius);
            const endFrame = Math.floor(time + radius);

            // Clamp to valid buffer range
            const validStart = Math.max(0, startFrame);
            const validEnd = Math.min(totalFrames - 1, endFrame);

            // Determine sign based on shape
            let sign = 1.0;
            if (shape === 'fall' || shape === 'fall-rise') {
                sign = -1.0;
            }
            // For complex shapes like fall-rise or rise-fall, simple sign flip might not be enough.
            // But preserving existing logic for now:
            // Existing logic: if fall or fall-rise, sign = -1.0.

            for (let i = validStart; i <= validEnd; i++) {
                const d = i - time;
                
                if (radius > 0) {
                    // Kernel: 0.5 * (1 + cos(pi * d / radius))
                    // This creates a window from -radius to +radius
                    // Check if d is within radius (it should be given loop range generally but good to verify)
                    if (Math.abs(d) <= radius) {
                        const ratio = d / radius;
                        const w = 0.5 * (1 + Math.cos(Math.PI * ratio));
                        output[i] += w * peakCents * sign;
                    }
                }
            }
        }

        return output;
    }
}
