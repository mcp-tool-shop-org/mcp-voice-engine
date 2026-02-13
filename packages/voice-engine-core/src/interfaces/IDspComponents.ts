import { IModule } from "./IModule.js";
import { AudioBufferV1 } from "../schema/SynthesisV1.js";

export interface F0TrackV1 {
  times: Float32Array;
  frequencies: Float32Array;
  confidence: Float32Array;
}

export interface IPitchTracker extends IModule {
  estimate(audio: AudioBufferV1): Promise<F0TrackV1>;
}

export interface IPitchShifter extends IModule {
  shift(
    audio: AudioBufferV1,
    f0: F0TrackV1,
    targetCents: Float32Array
  ): Promise<AudioBufferV1>;
}
