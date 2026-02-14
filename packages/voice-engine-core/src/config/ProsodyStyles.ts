import { ProsodyStyleV1, ProsodyStyleIdV1 } from "../prosody/ProsodyV1.js";

export const SPEECH_NEUTRAL: ProsodyStyleV1 = {
    id: 'speech_neutral',
    accentMaxCents: 600, // +/- 600 cents
    boundaryMaxCents: 400,
    accentSpanSeconds: 0.15,
    eventStrengthScale: 1.0,
    residualMix: 1.0,
    postFocusCompression: 0.2
};

export const SPEECH_EXPRESSIVE: ProsodyStyleV1 = {
    id: 'speech_expressive',
    accentMaxCents: 900, // Very dynamic
    boundaryMaxCents: 500,
    accentSpanSeconds: 0.18,
    eventStrengthScale: 1.2,
    residualMix: 1.0,
    postFocusCompression: 0.5
};

export const POP_TIGHT: ProsodyStyleV1 = {
    id: 'pop_tight',
    accentMaxCents: 400, // Controlled
    boundaryMaxCents: 200, // Subtle phrase ends
    accentSpanSeconds: 0.10, // Snappy
    eventStrengthScale: 0.8,
    residualMix: 0.3, // Less jitter, cleaner tone
    postFocusCompression: 0.1
};

export const ROBOT_FLAT: ProsodyStyleV1 = {
    id: 'robot_flat',
    accentMaxCents: 0, // Flat
    boundaryMaxCents: 0,
    accentSpanSeconds: 0.10,
    eventStrengthScale: 0.0,
    residualMix: 0.0,
    postFocusCompression: 0.0
};

export const RESOLVED_STYLES: Record<ProsodyStyleIdV1, ProsodyStyleV1> = {
    'speech_neutral': SPEECH_NEUTRAL,
    'speech_expressive': SPEECH_EXPRESSIVE,
    'pop_tight': POP_TIGHT,
    'robot_flat': ROBOT_FLAT
};

export function resolveProsodyStyle(style: ProsodyStyleIdV1 | ProsodyStyleV1): ProsodyStyleV1 {
    if (typeof style === 'string') {
        const resolved = RESOLVED_STYLES[style];
        if (!resolved) {
            console.warn(`Unknown style id: ${style}, fallback to neutral.`);
            return SPEECH_NEUTRAL;
        }
        return resolved;
    }
    // Assume it's a full object
    return { ...SPEECH_NEUTRAL, ...style };
}
