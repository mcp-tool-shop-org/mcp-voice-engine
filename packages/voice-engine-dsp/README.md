# Voice Engine DSP

Core Digital Signal Processing (DSP) modules for the Voice Engine ecosystem. This package handles audio analysis, pitch correction, and transformation using deterministic pipelines.

## Features

### 1. Deterministic Autotune (Phase 5)
A state-of-the-art, deterministic pitch correction pipeline designed for reliable, reproducible tuning. Unlike traditional "automagic" plugins, this system gives you frame-perfect control over how pitch is generated and corrected.

#### Key Components:
- **`TunePlanResolver`** (in Core): Compiles high-level user intent (Scales, Notes) into a deterministic execution plan.
- **`TargetCurveGenerator`**: Generates high-precision continuous pitch curves derived from the plan. Uses milli-cent Q-format fixed-point math for precision.
- **`ScaleQuantizer`**: Maps raw input pitch to the nearest valid scale degree with configurable snap strength.
- **`AutotuneExecutor`**: The runtime orchestrator that connects Analysis, Plan Generation, and Pitch Shifting.
- **`PitchShifterRefV1`**: A reference PSOLA (Pitch Synchronous Overlap-Add) implementation supporting formant-aware or chipmunk-style shifting.

### Usage Example

```typescript
import { AutotuneExecutor, PitchShifterRefV1 } from '@mcp-voice-engine/dsp';
import { TuneRequestV1 } from '@mcp-voice-engine/core';

// 1. Configure the request
const request: TuneRequestV1 = {
  spec: {
    mode: 'auto',
    config: {
      mode: 'scale',
      key: 'C',
      scale: 'major',
      snapStrengthQ: 10000, // Hard snap
      glideMsQ: 50 // 50ms transitions
    }
  }
};

// 2. Initialize Executor
const shifter = new PitchShifterRefV1();
const executor = new AutotuneExecutor(shifter);

// 3. Process Audio (returns transformed buffer)
const result = await executor.execute(request, inputAudioBuffer);
```

## Architecture

The DSP pipeline operates on raw PCM data (Float32) and utilizes a specialized Q-format numeric system for internal calculations to ensure consistency across environments.

- **Audio Buffer**: Standard Float32Array PCM.
- **Control Signals**: Integer-based Q-format (e.g., Milli-Cents) to avoid floating-point drift.
