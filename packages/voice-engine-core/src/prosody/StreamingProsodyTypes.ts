export interface SegmenterStateV1 {
    isVoiced: boolean;
    enterCount: number;
    exitCount: number;
    currentSegmentStart: number;
    accumulatedConf: number;
    accumulatedEnergy: number;
}

export interface DecomposerStateV1 {
    buffer: Float32Array; // For windowing
    microState?: any;
}

export interface BaselineStateV1 {
    sumX: number;
    sumY: number;
    sumXY: number;
    sumXX: number;
    count: number;
}

export interface StabilizerStateV1 {
    currentNoteId: number;
    lastTargetCents: number;
    holdFrames: number;
    rampActive: boolean;
    rampStartCents: number;
    rampEndCents: number;
    rampProgress: number;
}

export interface PFCState {
    focusTime: number | null; // Frame index
    focusStrength: number;
    activeFade: number; // 0..1
}

export interface ProsodyRuntimeStateV1 {
    segmenter: SegmenterStateV1;
    decomposer: DecomposerStateV1;
    baseline: BaselineStateV1;
    stabilizer: StabilizerStateV1;
    pfc: PFCState;
}
