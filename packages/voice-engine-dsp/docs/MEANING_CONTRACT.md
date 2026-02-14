# Meaning Contract & Test Suite

## Overview
The "Meaning" of the autotune engine is defined by its compliance with the following tests. These tests ensure that the engine behaves musically and physically correctly, not just that it runs without crashing.

## Test Suite (Golden Tests)

### Test A: Locality
**Requirement**: An event generated at time `T` must effectively modify pitch at `T`, and decay to near-zero effect by `T + Radius`.
- **Verification**: Ensure output matches baseline outside the event window.

### Test B: Boundaries
**Requirement**: Processing 10 chunks of 100ms must yield identical results to processing 1 chunk of 1s (assuming compatible hop sizes).
- **Verification**: `testLocality` handles chunked vs monolithic comparisons.

### Test C: Events (Rise/Fall)
**Requirement**: 
- Positive Strength = Rise (Increase Cents).
- Negative Strength = Fall (Decrease Cents).
- **Verification**: Check polarity of delta against baseline.

### Test D: PFC (Compression)
**Requirement**: "Post-Correction" means applying autotune *less* when an intentional expression (event) is active.
- **Verification**: If `pfcStrength > 0`, the final output should be closer to the *original* (or baseline) curve during high-energy events, essentially "ducking" the pitch correction.

### Test E: Chunking
**Requirement**: State must safely carry over chunk boundaries without artifacts (clicks, state resets).
- **Verification**: Run audio in micro-chunks (e.g., 64 samples) and compare to standard chunks.

## Regression Policy

1. **Tolerance**: 
   - Floating point jitter < 0.0001 cents is ignored.
   - Algorithmic changes may alter output > 1 cent, but must be manually reviewed and golden references updated.
   
2. **Performance**:
   - Any regression in RTF > 10% requires investigation.
   - Any allocation > 0 per frame is a hard failure.

3. **Determinism**:
   - Non-deterministic output (varying between runs) is a critical bug.
