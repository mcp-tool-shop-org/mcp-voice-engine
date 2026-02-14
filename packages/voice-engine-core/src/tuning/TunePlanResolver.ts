import { TuneRequestV1, TunePlanV1, TuningPreset } from "../schema/TuningV1";

export class TunePlanResolver {
    readonly version = "1.0.0";

    resolve(req: TuneRequestV1): TunePlanV1 {
        // 1. Resolve Preset defaults
        const preset = req.preset || "natural";
        const defaults = this.getPresetValues(preset);

        // 2. Merge overrides
        const snap = req.overrides?.snapStrength ?? defaults.snap;
        const glide = req.overrides?.glideMs ?? defaults.glide;
        const speed = req.overrides?.retuneSpeed ?? defaults.speed;
        const prot = req.overrides?.consonantProtection ?? defaults.protection;

        // Phase 6 optional overrides
        // Helper to safely access config if it's scale mode
        const scaleConfig = (req.mode === "scale" || (req as any).config?.mode === "scale") 
            ? (req as any).config 
            : undefined;
            
        // Resolving Phase 6 parameters: Check scaleConfig (Q-format) OR overrides (Human-format)
        const globalStrength = scaleConfig?.globalStrengthQ ?? (req.overrides?.globalStrength !== undefined ? req.overrides.globalStrength * 100 : 10000);
        const attack = scaleConfig?.attackMsQ ?? (req.overrides?.attackMs ?? 0);
        const release = scaleConfig?.releaseMsQ ?? (req.overrides?.releaseMs ?? 0);
        const hysteresis = scaleConfig?.hysteresisCentsQ ?? (req.overrides?.hysteresisCents ?? 0);

        // 3. Resolve Scale
        const key = req.mode === "scale" ? req.key : (req as any).config?.key ?? "C";
        const scale = req.mode === "scale" ? req.scale : (req as any).config?.scale ?? "chromatic";
        
        const pcs = this.resolvePitchClasses(key.toUpperCase(), scale.toLowerCase());

        return {
            mode: req.mode,
            scaleConfig: {
                key,
                scale,
                allowedPitchClasses: pcs,
                referenceHz: 440
            },
            parameters: {
                snapStrengthQ: Math.floor(this.clamp(snap, 0, 100) * 100),
                // glideMsQ defined once
                glideMsQ: Math.floor(glide),
                retuneSpeedQ: Math.floor(this.clamp(speed, 0, 100) * 100),
                consonantProtectionQ: Math.floor(this.clamp(prot, 0, 100) * 100),
                
                // Phase 6
                globalStrengthQ: Math.floor(this.clamp(globalStrength, 0, 10000)),
                attackMsQ: Math.floor(Math.max(0, attack)),
                releaseMsQ: Math.floor(Math.max(0, release)),
                hysteresisCentsQ: Math.floor(Math.max(0, hysteresis))
            },
            meta: {
                resolverVersion: this.version,
                timestamp: Date.now()
            }
        };
    }

    private clamp(v: number, min: number, max: number) {
        return Math.min(Math.max(v, min), max);
    }

    private getPresetValues(preset: TuningPreset) {
        switch (preset) {
            case "subtle": return { snap: 20, glide: 150, speed: 20, protection: 80 };
            case "natural": return { snap: 50, glide: 60, speed: 50, protection: 50 };
            case "pop": return { snap: 75, glide: 30, speed: 80, protection: 20 };
            case "hard": return { snap: 90, glide: 10, speed: 95, protection: 5 };
            case "robot": return { snap: 100, glide: 0, speed: 100, protection: 0 };
            default: return { snap: 50, glide: 60, speed: 50, protection: 50 };
        }
    }

    private resolvePitchClasses(key: string, scale: string): number[] {
        const NOTE_MAP: Record<string, number> = {
            "C": 0, "C#": 1, "DB": 1,
            "D": 2, "D#": 3, "EB": 3,
            "E": 4,
            "F": 5, "F#": 6, "GB": 6,
            "G": 7, "G#": 8, "AB": 8,
            "A": 9, "A#": 10, "BB": 10,
            "B": 11
        };

        const root = NOTE_MAP[key.replace(/ /g, "")] ?? 0;

        let intervals: number[];
        switch (scale) {
            case "chromatic": intervals = [0,1,2,3,4,5,6,7,8,9,10,11]; break;
            case "major": intervals = [0, 2, 4, 5, 7, 9, 11]; break;
            case "minor": intervals = [0, 2, 3, 5, 7, 8, 10]; break; // Natural minor
            case "pentatonic_major": intervals = [0, 2, 4, 7, 9]; break;
            case "pentatonic_minor": intervals = [0, 3, 5, 7, 10]; break;
            default: intervals = [0,1,2,3,4,5,6,7,8,9,10,11]; // Fallback to chromatic
        }

        return intervals.map(i => (root + i) % 12).sort((a,b) => a-b);
    }
}
