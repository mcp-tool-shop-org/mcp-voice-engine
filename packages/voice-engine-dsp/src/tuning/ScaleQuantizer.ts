export class ScaleQuantizer {
    /**
     * Quantizes an input pitch (in cents relative to A4=440Hz=6900) to the nearest allowed note.
     */
    static quantize(inputCents: number, allowedPitchClasses: number[]): number {
        // 1. Determine Octave and Semitone
        // MIDI 0 = C-1 = 0 cents? No. A4=6900.
        // C4 = 6000 cents.
        // 1200 cents per octave.
        // pitchClass = floor(cents / 100) % 12 ? No, cents are absolute.
        // Let's align to MIDI numbers.
        // midiVal = inputCents / 100.
        
        const midiVal = inputCents / 100.0;
        const noteIndex = Math.round(midiVal);
        
        // Optimize: check if noteIndex is allowed
        const pc = ((noteIndex % 12) + 12) % 12;
        if (allowedPitchClasses.includes(pc)) {
            return noteIndex * 100;
        }

        // Search nearest allowed
        // Brute force is fast enough (12 classes max).
        // Check neighbors up/down.
        let bestDist = Infinity;
        let bestCandidate = noteIndex;

        // Check +/- 12 semitones is sufficient
        for (let i = -6; i <= 6; i++) {
             const candidate = noteIndex + i;
             const cpc = ((candidate % 12) + 12) % 12;
             if (allowedPitchClasses.includes(cpc)) {
                 const dist = Math.abs(candidate - midiVal);
                 if (dist < bestDist) {
                     bestDist = dist;
                     bestCandidate = candidate;
                 }
             }
        }
        
        return bestCandidate * 100;
    }
}
