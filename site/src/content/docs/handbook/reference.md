---
title: Reference
description: Test suites, documentation index, and benchmarks.
sidebar:
  order: 4
---

## Test suites

| Command | What it tests |
|---------|---------------|
| `npm test` | Full suite — all tests |
| `npm run test:meaning` | Communicative behavior guardrails |
| `npm run test:determinism` | Hash-based regression tests |
| `npm run bench:rtf` | Real-time factor benchmark |
| `npm run smoke` | End-to-end smoke test |

## Documentation index

Primary docs live in `packages/voice-engine-dsp/docs/`:

| Document | Contents |
|----------|----------|
| `STREAMING_ARCHITECTURE.md` | Causal processing model, snapshot/restore, state management |
| `MEANING_CONTRACT.md` | Prosody behavior specification — what the engine promises |
| `DEBUGGING.md` | How to diagnose pitch issues, event ordering problems, and style drift |
| `Reference_Handbook.md` (root) | Full API reference and concept guide |
| `PERF_CONTRACT.md` (root) | Real-time factor and latency guarantees |

## Packages

| Package | Path | Contents |
|---------|------|----------|
| voice-engine-core | `packages/voice-engine-core/` | Shared types, schemas, config defaults, prosody interfaces, tuning logic, error codes |
| voice-engine-dsp | `packages/voice-engine-dsp/` | Core DSP, streaming autotune engine, adapters (Node stream, AudioWorklet), meaning tests, determinism tests, RTF benchmarks |

## Error codes

The engine uses structured error codes defined in `VoiceErrorCode` (voice-engine-core). Categories:

| Category | Examples |
|----------|----------|
| Core | `CORE_INVALID_CONFIG`, `CORE_TIMEOUT`, `CORE_RESOURCE_EXHAUSTED` |
| Synthesis | `SYNTH_INVALID_VOICE`, `SYNTH_UNSUPPORTED_LANGUAGE` |
| DSP | `DSP_PROCESSING_FAILED`, `PITCH_SHIFT_FAILED`, `UNSUPPORTED_SAMPLE_RATE` |
| IO | `IO_FILE_NOT_FOUND`, `IO_READ_ERROR`, `IO_NETWORK_ERROR` |

## Default configuration

| Parameter | Default | Source |
|-----------|---------|--------|
| Sample rate | 24000 Hz | `DEFAULT_CONFIG_V1` |
| F0 range | 60--600 Hz | `DEFAULT_ANALYSIS_CONFIG_V1` |
| Silence threshold | -60 dB | `DEFAULT_PROSODY_CONFIG_V1` |
| Voicing threshold | 2000 (Q scale) | `DEFAULT_PROSODY_CONFIG_V1` |
| Hysteresis | 15 cents | `DEFAULT_STABILIZER_CONFIG_V1` |
| Reference pitch | 440 Hz | `DEFAULT_TUNING_CONFIG_V1` |
| Default scale | chromatic | `DEFAULT_TUNING_CONFIG_V1` |

## Security and data scope

| Aspect | Detail |
|--------|--------|
| Data touched | In-memory float arrays (audio samples), configuration objects |
| Data NOT touched | No file system writes, no network, no telemetry |
| Permissions | None — pure computation library with no I/O side effects |
| Network | None — fully offline |

See [SECURITY.md](https://github.com/mcp-tool-shop-org/mcp-voice-engine/blob/main/SECURITY.md) for vulnerability reporting.
