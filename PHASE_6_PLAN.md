# Phase 6 Plan: High Leverage, Low Chaos

**Status**: ACTIVE
**Dependencies**: [Phase 5 Complete (v0.5.0-autotune)](PHASE_5_COMPLETION_REPORT.md)

## Objective
With the deterministic core (Milli-cent precision) verified, Phase 6 focuses on stress-testing signal integrity, adding human-centric controls, and locking in performance guarantees.

## 1. Musical Correctness Under Stress (The "No Warble" Zone)
*   **Goal**: Ensure the autotune algorithm remains musical and artifact-free in challenging conditions.
*   **Test Cases**:
    *   **Vibrato**: Input signal with natural Hz oscillation. Quantizer should track the mean, not fight the LFO.
    *   **Glides/Portamento**: Smooth input pitch transitions. Ensure transition logic doesn't stair-step.
    *   **Unvoiced/Noisy**: Breath, sibilance (`s`, `t`, `ch`). Ensure pitch correction disengages or holds steady (hysteresis).
    *   **Polyphony Leak**: Background noise or bleed. Pitch detector robustness check.

## 2. Control Surface & Ergonomics (User Intent)
*   **Goal**: Expose the underlying DSP parameters as musical controls.
*   **New Parameters**:
    *   `Correction Strength` (0-100%): Interpolate between `Input` and `Corrected`.
    *   `Attack/Release`: How quickly correction applies (Natural vs Robot).
    *   `Hysteresis`: Prevent rapid flipping between adjacent notes at boundary conditions.
    *   `Formant Preservation`: Basic stub for formant-corrected shifting vs chipmunk style.

## 3. Performance & Determinism (The Contract)
*   **Goal**: Verify that the system is production-ready.
*   **Benchmarks**:
    *   **CPU Usage**: Measure cost per frame. Target < 5ms for 10ms frame on standard hardware.
    *   **Allocations**: Audit hot path (GC pressure).
    *   **Determinism**: Verify `Hash(Output) == Constant` for identical inputs.
    *   **Latency**: Measure total round-trip delay impact.

## Execution Plan
1.  Create `stress_test_suite.ts` to generate synthetic vibrato/noise signals.
2.  Implement `CorrectionController` extensions for Attack/Release/Strength.
3.  Add `PerformanceMonitor` to the DSP pipeline.
