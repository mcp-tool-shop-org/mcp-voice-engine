# Dependency Rules

To maintain the architectural integrity of the Voice Engine, strict dependency rules are enforced.

## 1. Core Isolation
`@mcp-voice/core` **MUST NOT** import from:
- `fs`, `net`, `http` (Standard Node.js I/O modules)
- Any adapter package
- Any DSP implementation package

Core is **pure policy and data definition**.

## 2. DSP Purity
DSP modules **MUST NOT** import from:
- `fs` (Filesystem)
- Network libraries

DSP modules **MAY** import:
- `@mcp-voice/core` (for Types/Interfaces)

DSP operates on **Buffers**, not Files.

## 3. Adapter Responsibility
Adapters (CLI, MCP Server, File Writer) **MAY** import:
- `@mcp-voice/core`
- Node.js APIs (`fs`, `process`)

Adapters are the **only** place where path strings become file streams.

## 4. The "Path" Ban
- `SynthesisResult` must not contain paths.
- `DspRequest` must not contain paths.
- `RenderPlan` (internal structure) must not contain paths (except in the final `output` directive).

## Enforcement
(Future): ESLint `import/no-restricted-paths` rules will enforce this.
