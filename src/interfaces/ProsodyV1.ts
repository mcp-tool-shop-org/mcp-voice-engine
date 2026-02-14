// mcp-voice-engine/src/interfaces/ProsodyV1.ts

export interface F0Track {
    /** Consistency/Confidence metric in Q format (e.g. Q8 or Q15 depending on extractor) */
    confQ: Int16Array; 
    /** Number of samples between frames */
    hopSamples: number;
    /** Sample rate of the source audio */
    sampleRateHz: number;
}

export type SegmentKind = 'voiced' | 'unvoiced' | 'silence';

export interface ProsodySegment {
    kind: SegmentKind;
    startFrame: number;
    endFrame: number;
}

export interface SegmentationConfig {
    /** RMS Energy threshold in Decibels (dB) below which is considered silence */
    silenceThresholdDb: number;
    
    /** Confidence threshold (raw value matching confQ scale) for detecting voicing */
    voicingThreshold: number;
    
    /** Number of consecutive frames above threshold required to enter 'voiced' state */
    voicedEnterCount: number;
    
    /** Number of consecutive frames below threshold allowed before exiting 'voiced' state (hangover) */
    voicedExitCount: number;
    
    /** Minimum number of silence frames to constitute a phrase break or separate segment */
    // minSilenceFrames: number; // Implied by segmentation logic, or post-processing? 
    // Usually standard segmentation produces contiguous segments. 
    // If silence is too short, does it merge? Detailed requirements say:
    // "Significant silence duration suggests a phrase break."
    // We will just output 'silence' segments. 
}

export const DEFAULT_SEGMENTATION_CONFIG: SegmentationConfig = {
    silenceThresholdDb: -50,
    voicingThreshold: 10000, // Assuming Q15-ish, adjustable
    voicedEnterCount: 2,
    voicedExitCount: 5
};
