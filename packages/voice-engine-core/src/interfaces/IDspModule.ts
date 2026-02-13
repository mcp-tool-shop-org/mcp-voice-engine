import { IModule } from "./IModule";
import { AudioBufferV1 } from "../schema/SynthesisV1";
import { DspRequestV1, DspResultV1 } from "../schema/DspV1";

export interface IDspModule extends IModule {
    process(audio: AudioBufferV1, req: DspRequestV1): Promise<DspResultV1>;
}
