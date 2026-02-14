import { ProsodySegmentV1, TargetStabilizerConfigV1, StabilizedTargetV1 } from './ProsodyV1.js';

export class TargetStabilizer {
    public stabilize(
        intentHz: Float32Array, 
        segments: ProsodySegmentV1[], 
        config: TargetStabilizerConfigV1 = {},
        frameHz: number = 100
    ): StabilizedTargetV1 {
        const len = intentHz.length;
        const targetCents = new Float32Array(len);
        const noteIds = new Int32Array(len).fill(-1);
        const inTransition = new Uint8Array(len);

        // Config Defaults
        const allowed = config.allowedPitchClasses || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]; // Chromatic
        const rootOffset = config.rootOffsetCents || 0;
        const hysteresis = config.hysteresisCents ?? 15;
        const minHoldMs = config.minHoldMs ?? 60;
        const minHoldFrames = Math.max(1, Math.round((minHoldMs / 1000) * frameHz));
        
        const slopeThreshSec = config.transitionSlopeThreshCentsPerSec ?? 500;
        const slopeThreshFrame = slopeThreshSec / frameHz;

        const rampMs = config.switchRampMs ?? 30;
        const rampFrames = Math.max(1, Math.round((rampMs / 1000) * frameHz));

        // Pre-calculate allowed set for fast lookup
        const allowedSet = new Set(allowed);

        // Helper: Frequency to Cents (A4=440=6900)
        const hzToCents = (h: number) => 
            (h > 1.0) ? (6900 + 1200 * Math.log2(h / 440)) : 0;

        // Helper: Quantize Cents to Nearest Allowed Note
        const quantize = (c: number): { id: number, center: number } => {
            // Apply root offset
            const local = c - rootOffset;
            const midi = Math.round(local / 100);
            
            // Check if allowed
            // (midi % 12 + 12) % 12 to handle negatives safely
            const pc = ((midi % 12) + 12) % 12;
            
            if (allowedSet.has(pc)) {
                return { id: midi, center: midi * 100 + rootOffset };
            }

            // Search neighbors if not allowed
            // Spiral out: +/- 1, +/- 2...
            for (let i = 1; i <= 6; i++) {
                // Check up
                let m = midi + i;
                let p = ((m % 12) + 12) % 12;
                if (allowedSet.has(p)) return { id: m, center: m * 100 + rootOffset };
                
                // Check down
                m = midi - i;
                p = ((m % 12) + 12) % 12;
                if (allowedSet.has(p)) return { id: m, center: m * 100 + rootOffset };
            }
            
            // Fallback (shouldn't happen with at least one allowed note)
            return { id: midi, center: midi * 100 + rootOffset };
        };

        // Process each voiced segment independently
        for (const seg of segments) {
            if (seg.kind !== 'voiced') continue;

            const start = seg.startFrame;
            const end = seg.endFrame;

            // State for this segment
            let currentNoteId = -1000; // Impossible ID
            let currentTargetCents = 0;
            let lastSwitchFrame = -minHoldFrames; // Allow immediate switch at start
            
            // Smoothing State
            let rampStartVal = 0;
            let rampEndVal = 0;
            let rampFrameCount = 0; 
            let ramping = false;

            for (let i = start; i < end; i++) {
                // 1. Convert Input
                const rawCents = hzToCents(intentHz[i]);
                
                // 2. Detect Transition (Slope)
                // Finite difference: (current - prev)
                // Use i-1 if in segment, else look ahead or 0
                let delta = 0;
                if (i > start) {
                    const prevRaw = hzToCents(intentHz[i-1]);
                    delta = Math.abs(rawCents - prevRaw);
                } else if (i < end - 1) {
                     // Look ahead for first frame
                     const nextRaw = hzToCents(intentHz[i+1]);
                     delta = Math.abs(rawCents - nextRaw);
                }

                const isTransition = delta > slopeThreshFrame;
                if (isTransition) {
                    inTransition[i] = 1;
                }

                // 3. Determine "Stable Note" for this frame
                const cand = quantize(rawCents);

                // Init case
                if (currentNoteId === -1000) {
                    currentNoteId = cand.id;
                    currentTargetCents = cand.center;
                    lastSwitchFrame = i;
                    
                    // Initialize smoother to this target immediately
                    rampEndVal = currentTargetCents;
                    rampStartVal = currentTargetCents;
                    ramping = false;
                } else {
                    // Logic: Should we switch?
                    // Rule 1: Not in transition (Mode A: hold during glide)
                    // Rule 2: Hysteresis satisfied
                    // Rule 3: Hold time satisfied
                    
                    let shouldSwitch = false;
                    const timeHeld = i - lastSwitchFrame;

                    if (!isTransition && timeHeld >= minHoldFrames) {
                        const currentErr = Math.abs(rawCents - currentTargetCents);
                        const candErr = Math.abs(rawCents - cand.center);
                        const improvement = currentErr - candErr;

                        if (improvement > hysteresis) {
                            shouldSwitch = true;
                        }
                    }

                    if (shouldSwitch) {
                        // Trigger Switch
                        // Setup Ramp: from current instantaneous ramp value to new center
                        const currentRampVal = (ramping) ? this.getCurrentRampValue(rampStartVal, rampEndVal, rampFrameCount, rampFrames) : currentTargetCents;
                        
                        rampStartVal = currentRampVal;
                        rampEndVal = cand.center;
                        rampFrameCount = 0;
                        ramping = true;

                        currentNoteId = cand.id;
                        currentTargetCents = cand.center;
                        lastSwitchFrame = i;
                    }
                }

                noteIds[i] = currentNoteId;

                // 4. Synthesize Output Curve (Smoothing/Ramping)
                if (ramping) {
                    rampFrameCount++;
                    const val = this.getCurrentRampValue(rampStartVal, rampEndVal, rampFrameCount, rampFrames);
                    targetCents[i] = val;
                    if (rampFrameCount >= rampFrames) {
                        ramping = false; // reached target
                    }
                } else {
                    targetCents[i] = currentTargetCents;
                }
            }
        }

        return {
            targetCents,
            noteIds,
            inTransition
        };
    }

    private getCurrentRampValue(start: number, end: number, currentFrame: number, totalFrames: number): number {
        if (currentFrame >= totalFrames) return end;
        const t = currentFrame / totalFrames;
        // Linear Crossfade
        return start + (end - start) * t;
    }
}
