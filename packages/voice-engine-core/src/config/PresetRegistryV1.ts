import { Policy } from "./ConfigV1";

export interface VoicePresetV1 {
    name: string;
    speed: number;
    pitchCorrection: number; // 0.0 to 1.0
    formantShift: number; // semitones
    style: "neutral" | "hard" | "soft" | "robot";
}

export class PresetRegistryV1 {
    private static presets: Record<string, VoicePresetV1> = {
        "subtle": { name: "subtle", speed: 1.0, pitchCorrection: 0.1, formantShift: 0, style: "neutral" },
        "natural": { name: "natural", speed: 1.0, pitchCorrection: 0.0, formantShift: 0, style: "neutral" },
        "pop": { name: "pop", speed: 1.05, pitchCorrection: 0.8, formantShift: 0, style: "hard" },
        "hard": { name: "hard", speed: 1.1, pitchCorrection: 1.0, formantShift: 0, style: "hard" },
        "robot": { name: "robot", speed: 1.0, pitchCorrection: 1.0, formantShift: -2, style: "robot" }
    };

    static resolvePreset(name: string): VoicePresetV1 {
        return this.presets[name.toLowerCase()] || this.presets["natural"];
    }

    static resolveAutoPolicy(input: unknown): Policy {
        // Deterministic implementation for now
        const policy: Policy = {
            allowExplicit: false,
            maxDurationSeconds: 60,
            allowedVoices: ["*"]
        };
        
        // Simple check just to have some logic
        if (typeof input === 'object' && input !== null && (input as any).unsafe === true) {
            policy.allowExplicit = true;
        }

        return policy;
    }
}
