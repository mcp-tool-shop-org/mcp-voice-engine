# MCP Voice Engine

Deterministic streaming prosody engine for voice synthesis.

MCP Voice Engine provides stable, reproducible pitch control and expressive prosody shaping for real-time voice pipelines. It is designed to behave like software, not folklore -- same input and config always produces the same output.

## Core capabilities

- **Deterministic output** -- hash-verified regression protection ensures reproducibility across runs.
- **Streaming-first runtime** -- stateful, causal processing with snapshot/restore for persistence and resumability.
- **Expressive prosody controls** -- event-driven accents and boundary tones shape cadence without destabilizing pitch targets.
- **Meaning tests** -- semantic guardrails enforce accent locality, question vs statement boundaries, post-focus compression, and style monotonicity.

## Packages

| Package | Description |
|---------|-------------|
| [`@mcptoolshop/voice-engine-dsp`](https://www.npmjs.com/package/@mcptoolshop/voice-engine-dsp) | Core DSP utilities -- pitch analysis, prosody, and audio processing |

## Quick start

```bash
npm i
npm run build
npm test
```

## Links

- [GitHub Repository](https://github.com/mcp-tool-shop-org/mcp-voice-engine)
- [Streaming Architecture](../packages/voice-engine-dsp/docs/STREAMING_ARCHITECTURE.md)
- [Meaning Contract](../packages/voice-engine-dsp/docs/MEANING_CONTRACT.md)
- [Debugging Guide](../packages/voice-engine-dsp/docs/DEBUGGING.md)

## License

MIT
