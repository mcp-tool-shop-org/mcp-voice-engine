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

This makes it suitable for:
- Real-time voice stylization in games and interactive apps
- Streaming voice pipelines (servers, bots, live processing)
- DAW and toolchain integration
- Web Audio demos (AudioWorklet-ready architecture)

## What you can build

The engine provides stable pitch targets and expressive controls that behave predictably:

- **Games and interactive apps** — stable targets, expressive controls, no warble
- **Streaming pipelines** — servers, bots, live voice processing
- **DAW integration** — deterministic pitch targets, consistent render behavior
- **Web Audio** — AudioWorklet-ready architecture
