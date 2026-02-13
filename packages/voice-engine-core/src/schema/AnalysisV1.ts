export interface F0TrackV1 {
    sampleRateHz: number;
    frameHz: number;
    hopSamples: number;
    t0Samples: number;
    f0MhzQ: Int32Array; // mHz (millihertz)
    confQ: Int16Array; // 0-10000
}

export interface VoicingMaskV1 {
    sampleRateHz: number;
    frameHz: number;
    hopSamples: number;
    t0Samples: number;
    voicedQ: Uint8Array; // 0 or 1
    voicingProbQ?: Int16Array; // 0-10000
}

export interface AnalysisPitchRequestV1 {
    type: "analyze_pitch";
    f0Min?: number;
    f0Max?: number;
}

export interface AnalysisVoicingRequestV1 {
    type: "analyze_voicing";
    threshold?: number;
}
