# Determinism Matrix

## Overview
This document outlines the determinism guarantees for the `StreamingAutotuneEngine`.
The system is designed to produce bit-exact output given the same:
1.  **Input Signal** (Audio samples)
2.  **Configuration** (Parameters like key, scale, hysteresis)
3.  **Environment** (Sample rate, Block size sequence)

A hash (SHA-256) of the output `targets` vector (Float32) is used to verify this determinism in CI/CD.

## The Matrix

| Factor | Description | Impact |
| :--- | :--- | :--- |
| **Input** | A synthesized "Complex Harmonic" signal (Sum of Sines). | Defines the "content" to be processed. |
| **Config** | Key: C, Scale: Major, Hysteresis: 10. | Defines the "rules" for correction. |
| **Environment** | 44.1kHz, sequential block processing. | Defines the "runtime context". |

## Guarantees

*   **Algorithmic Consistency**: The logic for pitch detection (mocked or real) and correction curve generation is deterministic.
*   **State Reset**: Instantiating a new engine guarantees a fresh state. There are no global statics affecting processing.

## Variances

*   **Floating Point**: We use `Float32Array`. On most modern systems (IEEE 754), operations are consistent. However, extremely small denormal numbers or compiler optimizations (Results of `Math.sin`) *can* vary slightly across completely different architectures or JS engines.
*   **Mitigation**: The test generates the input signal using `Math.sin` which is generally stable enough for this purpose. The hash verification ensures that if the underlying math changes, we know about it.

## Running the Test
Run `vitest` on `test/determinism_matrix.test.ts`.
The test generates a unique hash of the output stream.
