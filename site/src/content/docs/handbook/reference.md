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
| voice-engine-dsp | `packages/voice-engine-dsp/` | Core DSP, streaming prosody engine, meaning tests, determinism tests, RTF benchmarks |

## Security and data scope

| Aspect | Detail |
|--------|--------|
| Data touched | In-memory float arrays (audio samples), configuration objects |
| Data NOT touched | No file system writes, no network, no telemetry |
| Permissions | None — pure computation library with no I/O side effects |
| Network | None — fully offline |

See [SECURITY.md](https://github.com/mcp-tool-shop-org/mcp-voice-engine/blob/main/SECURITY.md) for vulnerability reporting.
