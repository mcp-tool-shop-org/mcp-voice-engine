---
title: Architecture
description: Streaming-first runtime design and deterministic guarantees.
sidebar:
  order: 2
---

MCP Voice Engine is built around two core commitments: **stability** and **reproducibility**. Most voice DSP systems fail in exactly these two places — warble, jitter, note flutter, and "it only happens sometimes" behavior.

## Deterministic output

Same input + configuration + chunking policy produces identical output every time. This is enforced through hash-based regression tests, not subjective listening.

The engine avoids all sources of non-determinism:
- No floating-point platform dependencies in the hot path
- No random number generators
- No time-dependent behavior
- Canonical event ordering guaranteed

## Streaming-first runtime

The processing model is **stateful and causal** — designed for low-latency, real-time use:

- No retroactive edits (what's emitted stays emitted)
- Snapshot/restore support for persistence and resumability
- Designed for server, bot, and live processing pipelines

## Five-stage frame pipeline

Each audio frame flows through five stages inside `StreamingAutotuneEngine`:

1. **Segmentation** — Hysteresis-based voiced/unvoiced/silence classification using energy thresholds and voicing confidence. Configurable enter/exit frame counts prevent rapid toggling.
2. **Decomposition** — Separates the raw F0 curve into macro (intended note), micro (vibrato/jitter), and residual components.
3. **Baseline/Intent** — Online linear regression tracks phrase-level declination. The intent curve is what remains after removing the baseline.
4. **Stability** — Pitch quantization to the nearest allowed pitch class, with hysteresis to prevent warble. Smooth ramp transitions between notes avoid discontinuities.
5. **Events and Post-Focus Compression (PFC)** — Prosody events (accents, boundary tones) are applied as additive offsets using a raised cosine window. PFC compresses pitch range after a focal accent, simulating natural post-focus behavior.

## Snapshot and restore

`StreamingAutotuneEngine` supports full state serialization:

- `snapshot()` returns a versioned deep copy of all runtime state (segmenter, decomposer, baseline, stabilizer, PFC)
- `restore()` rehydrates from a snapshot, including Float32Array reconstruction after JSON round-trips
- Version checking prevents restoring incompatible snapshots (major version must match)

## Adapters

Two ready-made adapters wrap the engine for common deployment targets:

- **NodeStreamAutotune** — A Node.js `Transform` stream that buffers incoming audio into fixed-size blocks and feeds them to the engine. Accepts `Buffer` (raw float32 LE) or `Float32Array` input. Supports event injection via `enqueueEvents()`.
- **AutotuneProcessor** — Implements the `AudioWorkletProcessor` interface for Web Audio. Receives config and events via `MessagePort`, processes 128-sample blocks per render quantum.

## What you can build

The engine provides stable pitch targets and expressive controls that behave predictably:

- **Games and interactive apps** — stable targets, expressive controls, no warble
- **Streaming pipelines** — servers, bots, live voice processing
- **DAW integration** — deterministic pitch targets, consistent render behavior
- **Web Audio** — AudioWorklet-ready architecture
