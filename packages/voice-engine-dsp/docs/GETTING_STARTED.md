# Getting Started with Voice Engine DSP

## Installation

```bash
npm install @mcp-voice/dsp
```

## Batch Processing
For offline files or non-real-time contexts, use the `AutotuneExecutor`.

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

## Streaming Processing
For real-time applications (voice changers, live calls), use `StreamingAutotuneEngine`.

```typescript
import { StreamingAutotuneEngine } from '@mcp-voice/dsp';

// 1. Initialize
const engine = new StreamingAutotuneEngine({
    hysteresisCents: 15,
    rootOffsetCents: 0,
    rampFrames: 5,
    correctionStrength: 0.8
}, {});

// 2. Process Chunk (in audio callback)
// Input: Float32Array (e.g., 128 samples)
const { audio, targets } = engine.process(inputChunk);
```

## Events Example
Injecting prosodic events like accents or boundary tones in real-time.

```typescript
// Schedule a pitch "scoop" or accent
engine.enqueueEvents([{
    time: currentFrame + 25, // frame index into the future
    duration: 10,            // frames
    strength: 150,           // 1.5 semitones
    shape: 'rise-fall'       // shape type
}]);
```

## Common Pitfalls

1.  **Sample Rate Mismatches**: Ensure the `StreamingAutotuneEngine` is initialized with the correct logical sample rate of your audio context (e.g., 44.1kHz vs 48kHz). The DSP assumes 44.1kHz by default unless configured.
2.  **Chunk Sizes**: Very small chunk sizes (< 64 samples) may incur overhead. Very large chunks (> 4096) increase latency. 128-512 is the sweet spot.
3.  **Circular Buffer Overflows**: If `process()` is not called frequently enough, the internal ring buffers may overflow.
4.  **Confidence Gating**: If the input is noisy (breathing, background noise), the engine might try to tune it. Ensure your confidence threshold is set correctly in config.
