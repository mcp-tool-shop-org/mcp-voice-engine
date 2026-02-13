import { IModule } from "./IModule";

export interface IArtifactStore extends IModule {
    put(key: string, data: Uint8Array): Promise<void>;
    materialize(key: string): Promise<Uint8Array | null>;
}
