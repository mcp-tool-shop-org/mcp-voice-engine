/**
 * Interfaces for Prosody Analysis (Phase 7)
 */

export type ProsodySegmentKind = "voiced" | "unvoiced" | "silence";

export interface ProsodySegmentV1 {
    kind: ProsodySegmentKind;
    startFrame: number;
    endFrame: number;
    avgConfQ?: number; // 0..10000
    avgEnergyDb?: number; 
}

export interface ProsodyAnalysisConfigV1 {
    /** 
     * Minimum energy in dB for a frame to be considered "speech" (voiced or unvoiced).
     * e.g., -60 dB. Default: -60.
     */
    silenceThresholdDb?: number;
    
    /**
     * Minimum confidence for voicing (0..10000). 
     * e.g., 2000. Default: 2000.
     */
    voicingThresholdQ?: number;

    /** Frames needed to confirm voicing entry (debounce). Default: 2. */
    voicedEnterFrames?: number;

    /** Frames needed to confirm voicing exit (hangover). Default: 5. */
    voicedExitFrames?: number;
}
