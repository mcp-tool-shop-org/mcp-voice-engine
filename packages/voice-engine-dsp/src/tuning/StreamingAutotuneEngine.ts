import { ProsodyRuntimeStateV1, PFCState } from '../../../voice-engine-core/src/prosody/StreamingProsodyTypes';
import { OnlineStats } from '../../../voice-engine-core/src/prosody/OnlineStats';
import { PROSODY_API_VERSION } from '../version';

class RingBufferScheduler {
    private buffer: any[];
    private capacity: number;
    private head: number = 0;
    private count: number = 0;

    constructor(capacity: number = 1024) {
        this.capacity = capacity;
        this.buffer = new Array(capacity);
    }

    enqueue(events: any[]) {
        // Sort incoming batch to ensure local order
        events.sort((a, b) => a.time - b.time);
        
        for (const e of events) {
            if (this.count === this.capacity) {
                 // Buffer full. Drop oldest (head) to make room.
                 this.head = (this.head + 1) % this.capacity;
            } else {
                 this.count++;
            }
            const tail = (this.head + this.count - 1) % this.capacity;
            this.buffer[tail] = e;
        }
    }

    pruneOldEvents(currentTime: number) {
        while (this.count > 0) {
            const e = this.buffer[this.head];
            const end = e.endTime !== undefined ? e.endTime : (e.time + (e.duration || 10));
            if (end < currentTime) {
                this.buffer[this.head] = undefined; 
                this.head = (this.head + 1) % this.capacity;
                this.count--;
            } else {
                break;
            }
        }
    }

    getActiveEvents(currentTime: number, outList: any[]) {
        outList.length = 0;
        for (let i = 0; i < this.count; i++) {
            const idx = (this.head + i) % this.capacity;
            const e = this.buffer[idx];
            if (!e) continue;
            const end = e.endTime !== undefined ? e.endTime : (e.time + (e.duration || 10));
            
            if (e.time <= currentTime && end >= currentTime) {
                outList.push(e);
            }
        }
    }
}

export class StreamingAutotuneEngine {
    private state: ProsodyRuntimeStateV1;
    private config: any;
    private preset: any;
    private frameCount: number = 0;
    private eventScheduler: RingBufferScheduler;
    private _reusableEventList: any[] = [];
    private allowedSet: Set<number>;
    private _lastOutputCents: number = 0;
    private _mockPitchHz: number = 0;

    constructor(config: any, preset: any) {
        this.config = config;
        this.preset = preset;
        this.state = this.createInitialState();
        this.eventScheduler = new RingBufferScheduler();
        
        const allowed = config.allowedPitchClasses || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        this.allowedSet = new Set(allowed); 
    }
    
    private hzToCents(h: number): number {
        return (h > 1.0) ? (6900 + 1200 * Math.log2(h / 440)) : 0;
    }

    private quantize(c: number): { id: number, center: number } {
        const rootOffset = this.config.rootOffsetCents || 0;
        const local = c - rootOffset;
        const midi = Math.round(local / 100);
        const pc = ((midi % 12) + 12) % 12;

        if (this.allowedSet.has(pc)) {
            return { id: midi, center: midi * 100 + rootOffset };
        }

        for (let i = 1; i <= 6; i++) {
            let m = midi + i;
            let p = ((m % 12) + 12) % 12;
            if (this.allowedSet.has(p)) return { id: m, center: m * 100 + rootOffset };
            
            m = midi - i;
            p = ((m % 12) + 12) % 12;
            if (this.allowedSet.has(p)) return { id: m, center: m * 100 + rootOffset };
        }
        
        return { id: midi, center: midi * 100 + rootOffset };
    }

    public getLastOutputCents(): number {
        return this._lastOutputCents;
    }

    public setMockPitch(hz: number) {
        this._mockPitchHz = hz;
    }

    public enqueueEvents(events: any[]) {
        this.eventScheduler.enqueue(events);
    }

    process(chunk: Float32Array): { audio: Float32Array, targets: Float32Array } {
        const hopSize = 128; 
        const numFrames = Math.floor(chunk.length / hopSize);
        const targets = new Float32Array(numFrames);
        
        for (let i = 0; i < numFrames; i++) {
             const startSample = i * hopSize;
             
             // Mock Analysis (to be replaced by StreamingPitchTracker)
             let sumSq = 0;
             for (let j=0; j<hopSize; j++) {
                 // Check bounds
                 if (startSample + j < chunk.length) {
                    const s = chunk[startSample + j];
                    sumSq += s * s;
                 }
             }
             const rms = Math.sqrt(sumSq / hopSize);
             const energyDb = rms > 1e-9 ? 20 * Math.log10(rms) : -100;
             
             // Mock Pitch/Confidence (0 confidence = unvoiced)
             // In real impl, this comes from F0Decomposer
             const isVoiced = energyDb > -50 && this._mockPitchHz > 0;
             const frameAnalysis = {
                 energyDb,
                 confidenceQ: isVoiced ? 10000 : 0, 
                 pitchHz: this._mockPitchHz
             };

             // Using the new pipeline
             this.processFramePipeline(frameAnalysis, this.frameCount++);
             
             targets[i] = this._lastOutputCents;
        }
        
        return { audio: chunk.slice(), targets: targets };
    }

    processFrame(analysis: { energyDb: number; confidenceQ: number; pitchHz: number }, frameIndex: number): void {
        this.processFramePipeline(analysis, frameIndex);
    }
    
    processFramePipeline(analysis: { energyDb: number; confidenceQ: number; pitchHz: number }, frameIndex: number): void {
        const { energyDb, confidenceQ, pitchHz } = analysis;
        const config = this.config; 
        const segmenter = this.state.segmenter;

        // Defaults
        const silenceDb = config.silenceThresholdDb ?? -60;
        const voicingLimit = config.voicingThresholdQ ?? 2000;
        const enterLimit = config.voicedEnterFrames ?? 2;
        const exitLimit = config.voicedExitFrames ?? 5;

        // 1. Input Conditions
        const isSpeechCandidate = energyDb > silenceDb;
        const isVoicedCandidate = isSpeechCandidate && (confidenceQ > voicingLimit);

        // 2. Hysteresis Logic
        if (segmenter.isVoiced) {
             if (!isVoicedCandidate) {
                 segmenter.exitCount++;
                 if (segmenter.exitCount > exitLimit) {
                     this.handleSegmentEnd(frameIndex);
                 }
             } else {
                 segmenter.exitCount = 0;
             }
        } else {
             if (isVoicedCandidate) {
                 segmenter.enterCount++;
                 if (segmenter.enterCount >= enterLimit) {
                     this.handleSegmentStart(frameIndex);
                 }
             } else {
                 segmenter.enterCount = 0;
             }
        }

        // 3. Process Voiced Frame Pipeline
        if (segmenter.isVoiced) {
             segmenter.accumulatedConf += confidenceQ;
             segmenter.accumulatedEnergy += energyDb;

             // --- Pipeline Step 1: Decomposition ---
             const rawCents = this.hzToCents(pitchHz);
             
             // For now, assuming raw input IS the decomposition
             const centerCents = rawCents; 
             const residualCents = 0;

             
             // --- Pipeline Step 2: Baseline/Intent ---
             // Update Online Baseline (using Cents for linear regression on pitch)
             OnlineStats.update(this.state.baseline, frameIndex, rawCents);
             const { slope, intercept } = OnlineStats.getRegression(this.state.baseline);
             const intentCents = centerCents; 

             // --- Pipeline Step 3: Stability ---
             const stabilizer = this.state.stabilizer;
             const hysteresis = config.hysteresisCents ?? 15;
             const minHoldFrames = config.minHoldFrames ?? 6; 
             const rampFrames = config.rampFrames ?? 3;

             // Calc delta/slope for transition detection
             const delta = 0; // TODO: Track previous raw cents
             const isTransition = delta > (config.slopeThreshFrame ?? 5);

             const cand = this.quantize(intentCents);
             
             // Initialize if first voiced frame logic covered by handleSegmentStart -> default state
             if (stabilizer.currentNoteId === 0) {
                 stabilizer.currentNoteId = cand.id;
                 stabilizer.lastTargetCents = cand.center;
                 stabilizer.holdFrames = 0;
                 stabilizer.rampActive = false;
                 stabilizer.rampEndCents = cand.center;
                 stabilizer.rampStartCents = cand.center;
             } else {
                 stabilizer.holdFrames++;
                 let shouldSwitch = false; 

                 if (!isTransition && stabilizer.holdFrames >= minHoldFrames) {
                     const currentErr = Math.abs(intentCents - stabilizer.lastTargetCents);
                     const candErr = Math.abs(intentCents - cand.center);
                     if (currentErr - candErr > hysteresis) {
                         shouldSwitch = true;
                     }
                 }

                 if (shouldSwitch) {
                     stabilizer.rampStartCents = stabilizer.rampActive ? 
                        this.getCurrentRampValue(stabilizer) : stabilizer.lastTargetCents;
                     stabilizer.rampEndCents = cand.center;
                     stabilizer.rampActive = true;
                     stabilizer.rampProgress = 0;
                     
                     stabilizer.currentNoteId = cand.id;
                     stabilizer.lastTargetCents = cand.center;
                     stabilizer.holdFrames = 0;
                 }
             }

             // Ramping
             let macroCents = stabilizer.lastTargetCents;
             if (stabilizer.rampActive) {
                 stabilizer.rampProgress++;
                 macroCents = this.getCurrentRampValue(stabilizer);
                 if (stabilizer.rampProgress >= rampFrames) {
                     stabilizer.rampActive = false;
                 }
             }

             // --- Pipeline Step 4: Events/PFC ---
             this.eventScheduler.pruneOldEvents(frameIndex);
             this.eventScheduler.getActiveEvents(frameIndex, this._reusableEventList);
             
             let accentOffset = 0;
             for (const event of this._reusableEventList) {
                 const duration = event.duration || 10;
                 const strength = event.strength || 0;
                 const shape = event.shape || 'rise';
                 const radius = duration / 2;
                 const d = frameIndex - event.time;
                 
                 if (Math.abs(d) <= radius) {
                     const sign = (shape === 'fall' || shape === 'fall-rise') ? -1.0 : 1.0;
                     const w = 0.5 * (1 + Math.cos((Math.PI * d) / radius));
                     accentOffset += w * strength * sign; // Simple additive
                 }
             }
             
             // Update PFC State
             const pfc = this.state.pfc;
             
             // Track max accent strength in recent window (simple approach)
             const currentAbsAccent = Math.abs(accentOffset);
             if (currentAbsAccent > 0.01) {
                if (currentAbsAccent > pfc.focusStrength) {
                    pfc.focusStrength = currentAbsAccent;
                    pfc.focusTime = frameIndex;
                }
                pfc.activeFade = 1.0; 
             } else {
                pfc.activeFade *= 0.95; // Decay
                pfc.focusStrength *= 0.95;
             }


             // --- Pipeline Step 5: Reconstruct ---
             let finalCents = macroCents + accentOffset + residualCents;
             
             // Apply PFC
             if (this.state.pfc.activeFade > 0) {
                 const { slope, intercept } = OnlineStats.getRegression(this.state.baseline);
                 const baselineAtT = intercept + slope * frameIndex;
                 const compressionStrength = (this.config as any).pfcStrength ?? 0.5;
                 const factor = this.state.pfc.activeFade * compressionStrength;

                 if (!isNaN(intercept)) {
                    finalCents = baselineAtT + (finalCents - baselineAtT) * (1.0 - factor);
                 }
             }

             this._lastOutputCents = finalCents;
        }
    }

    private getCurrentRampValue(stabilizer: any): number {
        // Simple linear interpolation
        const total = this.config.rampFrames ?? 3;
        if (stabilizer.rampProgress >= total) return stabilizer.rampEndCents;
        const t = stabilizer.rampProgress / total;
        return stabilizer.rampStartCents + (stabilizer.rampEndCents - stabilizer.rampStartCents) * t;
    }

    private handleSegmentStart(index: number) {
        const segmenter = this.state.segmenter;
        segmenter.isVoiced = true;
        segmenter.enterCount = 0;
        segmenter.exitCount = 0;
        segmenter.currentSegmentStart = index;
        segmenter.accumulatedConf = 0;
        segmenter.accumulatedEnergy = 0;
        
        // Reset Stabilizer
        this.state.stabilizer.currentNoteId = 0; 
        this.state.stabilizer.holdFrames = 0;
        this.state.stabilizer.rampActive = false;
    }

    private handleSegmentEnd(index: number) {
        const segmenter = this.state.segmenter;
        segmenter.isVoiced = false;
        segmenter.exitCount = 0;
        segmenter.enterCount = 0;
    }
public snapshot(): { version: string, state: ProsodyRuntimeStateV1 } {
        // Deep copy state to prevent mutation of the snapshot
        const stateCopy = JSON.parse(JSON.stringify(this.state));
        return {
            version: PROSODY_API_VERSION,
            state: stateCopy
        };
    }

    public restore(snapshot: any): void {
        if (!snapshot || typeof snapshot !== 'object') {
            throw new Error('Invalid snapshot format');
        }

        const { version, state } = snapshot;
        
        if (!version || typeof version !== 'string') {
            throw new Error('Snapshot missing version');
        }

        const currentMajor = PROSODY_API_VERSION.split('.')[0];
        const snapshotMajor = version.split('.')[0];

        if (currentMajor !== snapshotMajor) {
            throw new Error(`Incompatible snapshot version. Current: ${PROSODY_API_VERSION}, Snapshot: ${version}`);
        }

        if (!state) {
            throw new Error('Snapshot missing state');
        }

        this.state = state;

        // Rehydrate Float32Arrays if they were serialized to objects
        if (this.state.decomposer && this.state.decomposer.buffer && !(this.state.decomposer.buffer instanceof Float32Array)) {
            const buf = this.state.decomposer.buffer as any;
            const len = Object.keys(buf).length;
            const newBuf = new Float32Array(len);
            for (let i = 0; i < len; i++) {
                newBuf[i] = buf[i];
            }
            this.state.decomposer.buffer = newBuf;
        }
    }

    
    reset(): void {
        this.state = this.createInitialState();
    }

    private createInitialState(): ProsodyRuntimeStateV1 {
        return {
            segmenter: {
                isVoiced: false,
                enterCount: 0,
                exitCount: 0,
                currentSegmentStart: 0,
                accumulatedConf: 0,
                accumulatedEnergy: 0
            },
            decomposer: {
                buffer: new Float32Array(0),
                microState: undefined
            },
            baseline: {
                sumX: 0,
                sumY: 0,
                sumXY: 0,
                sumXX: 0,
                count: 0
            },
            stabilizer: {
                currentNoteId: 0,
                lastTargetCents: 0,
                holdFrames: 0,
                rampActive: false,
                rampStartCents: 0,
                rampEndCents: 0,
                rampProgress: 0
            },
            pfc: {
                focusTime: null,
                focusStrength: 0,
                activeFade: 0
            }
        };
    }
}
