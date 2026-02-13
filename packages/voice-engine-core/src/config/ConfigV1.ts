export interface Policy {
    allowExplicit: boolean;
    maxDurationSeconds: number;
    allowedVoices: string[];
}

export interface AnalysisConfigV1 {
    windowMs: number;
    hopMs: number;
    f0Min: number;
    f0Max: number;
    voicingThreshold: number;
    silenceThreshold: number;
}

export interface VoiceEngineConfigV1 {
    sampleRate: number;
    channels: number;
    maxConcurrency: number;
    defaultPolicy: Policy;
    analysis?: AnalysisConfigV1;
}

export const DEFAULT_ANALYSIS_CONFIG_V1: AnalysisConfigV1 = {
    windowMs: 25,
    hopMs: 10,
    f0Min: 60,
    f0Max: 600,
    voicingThreshold: 0.3,
    silenceThreshold: 0.05
};

export const DEFAULT_CONFIG_V1: VoiceEngineConfigV1 = {
    sampleRate: 24000,
    channels: 1,
    maxConcurrency: 4,
    defaultPolicy: {
        allowExplicit: false,
        maxDurationSeconds: 30,
        allowedVoices: ["*"]
    },
    analysis: DEFAULT_ANALYSIS_CONFIG_V1
};
