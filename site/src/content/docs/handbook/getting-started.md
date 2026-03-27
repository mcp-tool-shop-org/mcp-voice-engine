---
title: Getting Started
description: Install, build, and run MCP Voice Engine.
sidebar:
  order: 1
---

MCP Voice Engine is a deterministic, streaming-first prosody engine for expressive voice synthesis.

## Prerequisites

- Node.js 20 or later
- npm

## Install and build

```bash
git clone https://github.com/mcp-tool-shop-org/mcp-voice-engine.git
cd mcp-voice-engine
npm i
npm run build
```

## Run tests

The full test suite covers determinism, meaning contracts, and real-time performance:

```bash
# Full suite
npm test

# Specific suites
npm run test:meaning       # communicative behavior guardrails
npm run test:determinism   # hash-based regression tests
npm run bench:rtf          # real-time factor benchmark
npm run smoke              # end-to-end smoke test
```

## Repository structure

The monorepo contains two packages with clean separation between shared types and DSP logic:

```
mcp-voice-engine/
├── packages/
│   ├── voice-engine-core/   # Shared types, schemas, config, prosody interfaces
│   │   └── src/
│   │       ├── config/      # Default presets, styles, analysis config
│   │       ├── interfaces/  # Module, pitch tracker, formant strategy contracts
│   │       ├── prosody/     # ProsodyV1 types, streaming state, F0 decomposer
│   │       ├── schema/      # Error codes, render plans, tuning, artifacts
│   │       └── tuning/      # TunePlanResolver, scale logic
│   └── voice-engine-dsp/    # Core DSP + streaming prosody engine
│       ├── docs/            # Architecture, meaning contract, debugging
│       ├── src/
│       │   ├── adapters/    # NodeStreamAutotune, AudioWorkletProcessor
│       │   ├── analysis/    # Pitch tracker, voicing detector
│       │   ├── prosody/     # AccentRenderer, SafetyRails, Presets
│       │   ├── transformation/ # Pitch shifter, formant strategy
│       │   ├── tuning/      # StreamingAutotuneEngine, scale quantizer
│       │   └── utils/       # Audio buffer utilities
│       └── test/            # Meaning, determinism, and benchmark suites
└── site/                    # Starlight handbook and landing page
```

## Key documentation

The primary docs live alongside the DSP package:

- `packages/voice-engine-dsp/docs/STREAMING_ARCHITECTURE.md` — causal processing model
- `packages/voice-engine-dsp/docs/MEANING_CONTRACT.md` — prosody behavior specification
- `packages/voice-engine-dsp/docs/DEBUGGING.md` — debugging guide
- `Reference_Handbook.md` — full API and concepts reference
