import { AudioBufferV1 } from "../schema/SynthesisV1";

export interface IFormantStrategy {
    apply(tuned: AudioBufferV1, original: AudioBufferV1): Promise<AudioBufferV1>;
}
