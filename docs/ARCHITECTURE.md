# Architecture: The Deterministic Voice Stream

The goal of this architecture is **determinism first**. 
The system is divided into strict layers. Dependencies flow **inwards** (towards Core). Data flows **downwards** (from Plan to Output).

## 1. Core (Pure)
**Responsibility**: Parsing, validation, planning, policies, schemas.
**Constraints**: 
- No filesystem access.
- No network access.
- No random numbers (unless seeded).
- No floating point ambiguity (explicit quantization).

**The Only Truth**: `RenderPlanV1`. 
Core does not "do" things. It produces a Plan of what *should* be done.

## 2. Adapters (Impure)
**Responsibility**: Talk to the messy outside world.
- MCP Tool Handling (stdio/http)
- File Output (writing artifacts)
- External APIs (calling Python, Cloud TTS)

**Constraints**:
- Must implement Core Interfaces.
- Must not be imported by Core.

## 3. DSP (Pure-ish)
**Responsibility**: Signal processing logic.
- Pitch tracking
- Pitch shifting
- Concatenation

**Constraints**:
- Operates on memory buffers (`AudioBufferV1`), not paths.
- Stateless (or explicitly stateful via passed state).
- Imports Core types, but not Adapters.

## 4. Synthesis Backend (Impure)
**Responsibility**: Generate raw audio from text.
- Wrapper around Kokoro / ElevenLabs / Local Models.

**Constraints**:
- Must return `SynthesisResultV1` (Audio + Alignment).
- Must define explicit Capabilities.
