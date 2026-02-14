# Debugging & Observability

## Tracing Warbles

"Warbling" usually occurs when the **Stabilizer** flips rapidly between two quantization targets (e.g., C# and D).

### Checklist
1. **Check Decomposition**: Is the input noisy? If `confidenceQ` fluctuates, the segmenter might be toggling voide/unvoiced.
2. **Check Hysteresis**: Increase `hysteresisCents`. Default is ~15. If the input pitch hovers exactly between notes, low hysteresis causes rapid switching.
3. **Check Retune Speed**: If `attackMs` or `rampFrames` is too low (e.g., 0 or 1), correction is instant/robotic. Increase to smooth transitions.

## ProsodyPlanV1 / Runtime State

When debugging, dump `engine.state`:

- **`segmenter`**: 
  - `isVoiced`: Current gate status.
  - `enterCount`/`exitCount`: Debounce counters.
- **`stabilizer`**:
  - `currentNoteId`: The MIDI note target.
  - `holdFrames`: How long we've been on this note. Low numbers (< 5) repeatedly implies instability.
  - `rampActive`: Logic is currently interpolating.
- **`baseline`**:
  - `slope`: The estimated declination. If this is wild, the RLS regression is unstable (check input data).
- **`pfc`**:
  - `activeFade`: 0.0 to 1.0. If 1.0, correction is strictly suppressed by an event.

## Common Issues

| Symptom | Probable Cause | Fix |
|:---|:---|:---|
| **Robotic / T-Pain Effect** | `rampFrames` too low | Increase `rampFrames` (e.g., 5-10). |
| **Gurgling at ends** | `voicingThresholdQ` too low | Increase threshold to ignore breath noise. |
| **Pitch snaps to wrong note** | `rootOffsetCents` mismatch | Verify key/scale settings and `allowedPitchClasses`. |
| **Latency / Delay** | Buffer size too large | Reduce chunk size (e.g., 512 -> 128 samples). |
