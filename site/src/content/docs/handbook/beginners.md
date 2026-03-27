---
title: Beginners
description: Zero-to-working guide for newcomers to MCP Voice Engine.
sidebar:
  order: 99
---

A step-by-step guide for developers who are new to voice DSP or MCP Voice Engine. By the end of this page you will have the engine running, understand its core concepts, and know where to go next.

## 1. What is MCP Voice Engine?

MCP Voice Engine is a TypeScript library for real-time pitch correction and prosody control. It processes audio as a stream of floating-point samples and outputs corrected audio with stable pitch targets. Unlike most voice DSP tools, it is fully deterministic -- the same input and configuration always produces identical output, verified by hash-based regression tests.

The library is split into two npm packages:

- **voice-engine-core** -- Shared types, configuration schemas, prosody interfaces, and tuning logic. This package defines *what* the engine can do.
- **voice-engine-dsp** -- The runtime engine, including the streaming autotune pipeline, pitch analysis, adapters for Node.js and Web Audio, and the full test suite. This package *does the work*.

There is no network, file system, or telemetry involved. The engine operates entirely on in-memory float arrays.

## 2. Prerequisites

You need:

- **Node.js 20** or later
- **npm** (comes with Node.js)
- A terminal (any OS)

No GPU, microphone, or audio hardware is required to build and test the library.

## 3. Installation and first run

Clone the repository, install dependencies, build, and run the tests:

```bash
git clone https://github.com/mcp-tool-shop-org/mcp-voice-engine.git
cd mcp-voice-engine
npm i
npm run build
npm test
```

If `npm test` exits with no failures, your setup is correct. The test suite covers determinism, prosody meaning contracts, and performance benchmarks.

## 4. Core concepts

### Frames and hops

Audio is divided into short overlapping windows called frames. The engine processes one frame at a time. The distance between consecutive frames (in samples) is the hop size -- typically 128 samples. At 24 kHz sample rate, each frame covers about 5.3 ms of audio.

### The five-stage pipeline

Every frame passes through five stages inside `StreamingAutotuneEngine`:

1. **Segmentation** -- Classifies each frame as voiced, unvoiced, or silence using energy thresholds and voicing confidence. Hysteresis prevents rapid toggling.
2. **Decomposition** -- Splits the raw pitch (F0) into a macro component (the intended note) and a micro component (vibrato, jitter, texture).
3. **Baseline** -- Tracks the slow phrase-level pitch trend (declination) using online linear regression. The intent is what remains after the baseline is removed.
4. **Stability** -- Quantizes pitch to the nearest allowed note in the configured scale, with hysteresis to prevent warble and smooth ramps between notes.
5. **Events and PFC** -- Applies prosody events (accents, boundary tones) as additive pitch offsets, then applies post-focus compression to simulate the natural narrowing of pitch range after a focal word.

### Presets and styles

A **preset** (`ProsodyPresetV1`) bundles analysis, stabilizer, and tuning parameters into a named configuration. Built-in presets include `DEFAULT_CLEAN`, `HARD_TUNE`, `NO_WARBLE`, and `SUBTLE`.

A **style** (`ProsodyStyleV1`) controls the expressive character of prosody events -- how wide accents are, how strong boundary tones are, and how much micro-prosody (vibrato/jitter) to mix in. Built-in styles: `robot_flat`, `speech_neutral`, `speech_expressive`, `pop_tight`.

### Determinism

The engine avoids all sources of non-determinism: no random number generators, no time-dependent behavior, no platform-specific floating-point paths. Hash-based golden tests verify that the same input always produces the same output, down to the bit.

## 5. Minimal working example

Here is the simplest way to process audio through the engine in Node.js:

```typescript
import { StreamingAutotuneEngine } from '@mcptoolshop/voice-engine-dsp';

// Create an engine with default config and preset
const engine = new StreamingAutotuneEngine(
  { allowedPitchClasses: [0, 2, 4, 5, 7, 9, 11] }, // C major scale
  {}  // default preset
);

// Simulate a 440 Hz input pitch
engine.setMockPitch(440);

// Process a block of 128 samples (one frame)
const input = new Float32Array(128).fill(0.5);
const { audio, targets } = engine.process(input);

// audio: the processed samples
// targets: per-frame pitch target in cents
console.log('Output cents:', targets[0]);
```

For Node.js streaming pipelines, wrap the engine in `NodeStreamAutotune`:

```typescript
import { StreamingAutotuneEngine } from '@mcptoolshop/voice-engine-dsp';
import { NodeStreamAutotune } from '@mcptoolshop/voice-engine-dsp';

const engine = new StreamingAutotuneEngine({}, {});
const transform = new NodeStreamAutotune({ engine, blockSize: 128 });

// Pipe audio through: readable -> transform -> writable
inputStream.pipe(transform).pipe(outputStream);

// Inject prosody events on the fly
transform.enqueueEvents([
  { type: 'accent', time: 100, strength: 0.8, shape: 'rise', duration: 15 }
]);
```

## 6. Common pitfalls

**Warble from low hysteresis.** If hysteresis is set below 5 cents, the stabilizer can oscillate rapidly between adjacent pitch classes. The `SafetyRails` module clamps hysteresis to a minimum of 5 cents, but if you bypass it with raw config, you may hear artifacts.

**Voicing threshold too low.** A voicing threshold below 100 classifies nearly all audio as voiced, including noise and breath. This sends garbage into the pitch pipeline. Keep it above 100 (default is 2000).

**Forgetting to build.** The monorepo uses TypeScript project references. Run `npm run build` from the root after any source change. Tests run against compiled output.

**Snapshot version mismatch.** `restore()` checks the major version of the snapshot against the current `PROSODY_API_VERSION`. If you upgrade the library and try to restore an old snapshot, you will get an error. Re-create the snapshot after upgrading.

**Block size assumptions.** `StreamingAutotuneEngine.process()` divides the input into 128-sample frames internally. If you pass a chunk that is not a multiple of 128, the last partial frame is silently skipped. The `NodeStreamAutotune` adapter handles buffering for you.

## 7. Next steps

- **[Getting Started](/mcp-voice-engine/handbook/getting-started/)** -- Full build instructions, test suites, and repository layout
- **[Architecture](/mcp-voice-engine/handbook/architecture/)** -- Deep dive into the streaming pipeline, snapshot/restore, and adapters
- **[Prosody Controls](/mcp-voice-engine/handbook/prosody/)** -- Styles, presets, safety rails, and event types
- **[Reference](/mcp-voice-engine/handbook/reference/)** -- Test commands, error codes, default configuration values, and security scope
- Source docs in `packages/voice-engine-dsp/docs/` -- `STREAMING_ARCHITECTURE.md`, `MEANING_CONTRACT.md`, `DEBUGGING.md`
