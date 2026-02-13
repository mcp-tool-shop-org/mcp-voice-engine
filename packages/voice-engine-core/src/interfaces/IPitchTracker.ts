import { IModule } from "./IModule";
import { AudioBufferV1 } from "../schema/SynthesisV1";

export interface PitchFrame {
    time: number;
    frequency: number;
    confidence: number;
}

export interface IPitchTracker extends IModule {
    track(audio: AudioBufferV1): Promise<PitchFrame[]>;
}
