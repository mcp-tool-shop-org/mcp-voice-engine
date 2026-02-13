export interface Policy {
    allowExplicit: boolean;
    maxDurationSeconds: number;
    allowedVoices: string[];
}

export interface VoiceEngineConfigV1 {
    sampleRate: number;
    channels: number;
    maxConcurrency: number;
    defaultPolicy: Policy;
}

export const DEFAULT_CONFIG_V1: VoiceEngineConfigV1 = {
    sampleRate: 24000,
    channels: 1,
    maxConcurrency: 4,
    defaultPolicy: {
        allowExplicit: false,
        maxDurationSeconds: 30,
        allowedVoices: ["*"]
    }
};
