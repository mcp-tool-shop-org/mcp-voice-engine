<div align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/mcp-voice-engine/main/assets/logo.jpg" alt="MCP Voice Engine Logo" width="100%">
</div>

# MCP Voice Engine

Deterministic, streaming-first prosody engine for expressive voice synthesis, pitch control, and real-time voice transformation.

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-voice-engine/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/mcp-tool-shop-org/mcp-voice-engine/ci.yml?branch=main&style=flat-square&label=CI" alt="CI"></a>
  <img src="https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js 18+">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/mcp-voice-engine?style=flat-square" alt="License"></a>
</p>

## Why this exists

Most voice DSP systems fail in two places: **stability** (warble, jitter, note flutter) and **reproducibility** (“it only happens sometimes”). MCP Voice Engine is built to be musical, causal, and deterministic—so it behaves like software, not folklore.

## What you can build with it

*   **Real-time voice stylization** for games and interactive apps (stable targets, expressive controls)
*   **Streaming voice pipelines** (servers, bots, live processing)
*   **DAW / toolchain integration** (deterministic pitch targets, consistent render behavior)
*   **Web Audio demos** (AudioWorklet-ready architecture)

## Quickstart

```bash
npm i
npm run build
npm test
```

## Core capabilities

### Deterministic output
Same input + config (and chunking policy) produces the same output, with regression protection via hash-based tests.

### Streaming-first runtime
Stateful, causal processing designed for low latency. No retroactive edits. Snapshot/restore supported for persistence and resumability.

### Expressive prosody controls
Event-driven accents and boundary tones let you shape cadence and intonation intentionally—without destabilizing pitch targets.

### Meaning tests (semantic guardrails)
The test suite enforces communicative behavior, including:
*   **accent locality** (no “smear”)
*   **question vs statement boundaries** (rise vs fall)
*   **post-focus compression** (focus has consequences)
*   **deterministic event ordering**
*   **style monotonicity** (expressive > neutral > flat without increasing instability)

## Documentation

Primary docs live in [packages/voice-engine-dsp/docs/](packages/voice-engine-dsp/docs/).

### Key documents

*   [Streaming Architecture](packages/voice-engine-dsp/docs/STREAMING_ARCHITECTURE.md)
*   [Meaning Contract](packages/voice-engine-dsp/docs/MEANING_CONTRACT.md)
*   [Debugging Guide](packages/voice-engine-dsp/docs/DEBUGGING.md)
*   [Reference Handbook](Reference_Handbook.md)

### Repository structure

`packages/voice-engine-dsp/` — core DSP + streaming prosody engine, tests, and benchmarks

## Running the test suites

```bash
npm test
```

Or run specific suites:

```bash
npm run test:meaning
npm run test:determinism
npm run bench:rtf
npm run smoke
```

## Support

- **Questions / help:** [Discussions](https://github.com/mcp-tool-shop-org/mcp-voice-engine/discussions)
- **Bug reports:** [Issues](https://github.com/mcp-tool-shop-org/mcp-voice-engine/issues)

## License

MIT
