# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |

## Reporting a Vulnerability

Email: **64996768+mcp-tool-shop@users.noreply.github.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Version affected
- Potential impact

### Response timeline

| Action | Target |
|--------|--------|
| Acknowledge report | 48 hours |
| Assess severity | 7 days |
| Release fix | 30 days |

## Scope

MCP Voice Engine is a **deterministic prosody engine** for expressive voice synthesis.

- **Data touched:** Audio sample buffers (in-memory float arrays). Configuration objects for pitch/prosody parameters
- **Data NOT touched:** No file system access beyond reading source. No network. No telemetry. No analytics. No user data
- **Network:** None — pure computation library, no listeners or egress
- **No secrets handling** — does not read, store, or transmit credentials
- **No telemetry** is collected or sent

### Security Model

- **Pure computation:** All processing is in-memory DSP on float arrays — no I/O side effects
- **Deterministic:** Same input + config produces same output — no randomness or external state
- **No runtime dependencies on external services** — fully offline
- **Streaming architecture:** Causal processing only, no retroactive data access
