export interface IModule {
    readonly id: string;
    readonly version: string;
    capabilities(): string[];
}
