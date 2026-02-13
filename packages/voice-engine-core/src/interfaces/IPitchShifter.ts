import { IModule } from "./IModule";
import { AudioBufferV1 } from "../schema/SynthesisV1";

export interface IPitchShifter extends IModule {
    shift(audio: AudioBufferV1, semitones: number): Promise<AudioBufferV1>;
}
