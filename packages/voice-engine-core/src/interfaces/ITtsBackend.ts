import { IModule } from "./IModule";
import { SynthesisRequestV1, SynthesisResultV1 } from "../schema/SynthesisV1";

export interface ITtsBackend extends IModule {
    synthesize(req: SynthesisRequestV1): Promise<SynthesisResultV1>;
}
