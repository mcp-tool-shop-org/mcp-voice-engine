# MCP Voice Engine

Deterministic, streaming-first prosody engine for expressive voice synthesis.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![NPM Version](https://img.shields.io/badge/npm-v0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Quickstart

```bash
npm i
npm run build
npm test
```

## Features

- **Determinism**: Consistent output for the same input.
- **Real-time Streaming**: Low-latency audio generation.
- **Prosody Events**: Fine-grained control over speech cadence and intonation.
- **Meaning Tests**: Validation of semantic understanding in synthesis.

## Documentation

For internal documentation, please refer to [packages/voice-engine-dsp/docs/](packages/voice-engine-dsp/docs/).

### Key Documents
- [Streaming Architecture](packages/voice-engine-dsp/docs/STREAMING_ARCHITECTURE.md)
- [Meaning Contract](packages/voice-engine-dsp/docs/MEANING_CONTRACT.md)
- [Reference Handbook](Reference_Handbook.md)

## Repository Structure

- `packages/voice-engine-dsp`: Core DSP logic and voice synthesis engine.
