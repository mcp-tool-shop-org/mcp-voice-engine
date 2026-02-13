/**
 * Scale logic and pitch quantization for tuning.
 * Defines standard scales and utilities for mapping keys to pitch classes.
 */

const CENTS_PER_SEMITONE = 100;
const SUB_CENTS = 10;
const UNITS_PER_SEMITONE = CENTS_PER_SEMITONE * SUB_CENTS; // 1000
const OCTAVE_UNITS = 12 * UNITS_PER_SEMITONE; // 12000

// Standard scale interval definitions (in semitones)
const SCALES: Record<string, number[]> = {
    "chromatic": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    "major": [0, 2, 4, 5, 7, 9, 11],
    "minor": [0, 2, 3, 5, 7, 8, 10], // Natural minor
    "natural_minor": [0, 2, 3, 5, 7, 8, 10],
    "harmonic_minor": [0, 2, 3, 5, 7, 8, 11],
    "melodic_minor": [0, 2, 3, 5, 7, 9, 11],
    "major_pentatonic": [0, 2, 4, 7, 9],
    "minor_pentatonic": [0, 3, 5, 7, 10],
    "blues": [0, 3, 5, 6, 7, 10]
};

const NOTE_NAMES: Record<string, number> = {
    "c": 0, "d": 2, "e": 4, "f": 5, "g": 7, "a": 9, "b": 11
};

/**
 * Parses a key string into its tonic MIDI number and accidental preference.
 * Defaults to C4 (MIDI 60) if not specified.
 * 
 * @param key Key string (e.g., "C", "C#", "Db Major", "F#")
 * @returns Object with tonicMidi (standard MIDI note) and accidental ("sharp" | "flat" | "natural")
 */
export function parseKey(key: string): { tonicMidi: number, accidental: string } {
    const cleanKey = key.trim().toLowerCase();
    
    // Extract root note part (e.g. "c#", "db", "f")
    const match = cleanKey.match(/^([a-g])(#|b)?/);
    
    if (!match) {
        return { tonicMidi: 60, accidental: "natural" };
    }

    const noteName = match[1];
    const accChar = match[2];

    let pitchClass = NOTE_NAMES[noteName];
    let accidental = "natural";

    if (accChar === '#') {
        pitchClass += 1;
        accidental = "sharp";
    } else if (accChar === 'b') {
        pitchClass -= 1;
        accidental = "flat";
    }

    // Normalize pitch class
    pitchClass = (pitchClass + 12) % 12;

    // Default to Octave 4 (C4 = 60)
    // C4 corresponds to MIDI 60 (Middle C). 
    // If pitchClass is 0 (C), 60+0=60.
    // If pitchClass is 11 (B), 60+11=71 (B4). 
    const tonicMidi = 60 + pitchClass; 

    return { tonicMidi, accidental };
}

/**
 * Returns the semitone intervals for a given scale name.
 */
export function getScaleIntervals(scale: string): number[] {
    const s = scale.toLowerCase().replace(/[\s-]/g, "_"); 
    return SCALES[s] || SCALES["chromatic"];
}

/**
 * Generates a set of allowed pitch classes (in cents * 10) for a given scale and tonic.
 * 
 * @param scaleName Name of the scale (e.g. "major", "minor")
 * @param tonicMidi MIDI number of the tonic.
 * @returns Set of pitch classes (0-11999).
 */
export function scaleToPitchClasses(scaleName: string, tonicMidi: number): Set<number> {
    const intervals = getScaleIntervals(scaleName);
    const tonicCentsQ = tonicMidi * UNITS_PER_SEMITONE;
    // We only care about pitch class, so mod octave
    const tonicPC = (tonicCentsQ % OCTAVE_UNITS);

    const pitchClasses = new Set<number>();

    for (const interval of intervals) {
        const offset = interval * UNITS_PER_SEMITONE;
        const pc = (tonicPC + offset) % OCTAVE_UNITS;
        pitchClasses.add(pc);
    }

    return pitchClasses;
}

/**
 * Finds the nearest allowed pitch in the given pitch classes.
 * 
 * Logic:
 * 1. Convert input to pitch class (mod 12000).
 * 2. Find nearest pitch class in the set.
 * 3. Tie-break: Favor smaller absolute interval, then favor lower pitch.
 * 4. Reconstruct absolute pitch.
 * 
 * @param inputCentsQ Absolute input pitch in cents * 10.
 * @param pitchClasses Set of allowed pitch classes (0-11999).
 * @returns Nearest allowed absolute pitch in cents * 10.
 */
export function nearestAllowedPitch(inputCentsQ: number, pitchClasses: Set<number>): number {
    // Normalize input to pitch class 0-11999
    // Handle negative numbers correctly for modulo
    const inputPC = ((inputCentsQ % OCTAVE_UNITS) + OCTAVE_UNITS) % OCTAVE_UNITS;

    let bestDiff = Infinity;

    for (const targetPC of pitchClasses) {
        // Calculate minimal circular distance
        // diff points from input to target
        let diff = targetPC - inputPC;

        // Wrap around logic
        if (diff > OCTAVE_UNITS / 2) {
            diff -= OCTAVE_UNITS;
        } else if (diff < -OCTAVE_UNITS / 2) {
            diff += OCTAVE_UNITS;
        }

        // Compare with best found so far
        if (Math.abs(diff) < Math.abs(bestDiff)) {
            bestDiff = diff;
        } else if (Math.abs(diff) === Math.abs(bestDiff)) {
            // Deterministic Tie-breaking:
            // "If tied, prefer lower pitch."
            // If we have symmetric options (e.g. +50 and -50 cents),
            // +50 means target is higher. -50 means target is lower.
            // We want lower, so we want the negative diff.
            if (diff < bestDiff) {
                bestDiff = diff;
            }
        }
    }

    // Reconstruct absolute pitch
    return inputCentsQ + bestDiff;
}
