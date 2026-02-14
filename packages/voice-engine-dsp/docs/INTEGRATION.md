# Integration Guide

This guide explains how to integrate `voice-engine-dsp` adapters into your application.

## Node.js Stream (Server-Side)

The `NodeStreamAutotune` adapter allows you to process audio streams in Node.js using the standard `Transform` stream interface.

### Example: Processing a Raw PCM File

This example reads a raw 32-bit float PCM file, processes it, and writes the output.

```typescript
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { StreamingAutotuneEngine, NodeStreamAutotune } from 'voice-engine-dsp';

async function run() {
    // 1. Configure the engine
    const config = {
        allowedPitchClasses: [0, 2, 4, 5, 7, 9, 11], // Major scale
        rootOffsetCents: 0
    };
    const preset = {}; 

    // 2. Initialize Engine
    const engine = new StreamingAutotuneEngine(config, preset);

    // 3. Create Adapter
    // Note: Input stream must provide Float32 LE bytes or Float32Array objects.
    const autotune = new NodeStreamAutotune({ 
        engine,
        blockSize: 128 // Optional, defaults to 128
    });

    // 4. Pipe streams
    await pipeline(
        fs.createReadStream('input.f32le'),
        autotune,
        fs.createWriteStream('output.f32le')
    );

    console.log('Processing complete.');
}
```

### Handling Events

You can inject control events (e.g. scale changes, bypass) via `enqueueEvents`.

```typescript
autotune.enqueueEvents([
    { time: 1.0, type: 'scale', value: 'minor' }
]);
```

---

## AudioWorklet (Browser)

The `AutotuneProcessor` adapter provides the logic for an `AudioWorkletProcessor` compliant class. Because `AudioWorkletProcessor` is only available in the browser's audio thread, you must wrap the adapter.

### 1. Create the Worklet Script

Create a file (e.g., `autotune.worklet.ts`) that will be bundled for the browser.

```typescript
// autotune.worklet.ts
import { AutotuneProcessor } from 'voice-engine-dsp/adapters/AudioWorkletProcessor';

// Start the Worklet
class RealAutotuneProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        // Pass the processor options and the MessagePort
        this.impl = new AutotuneProcessor(options, this.port);
    }

    process(inputs, outputs, parameters) {
        return this.impl.process(inputs, outputs, parameters);
    }
}

registerProcessor('autotune-processor', RealAutotuneProcessor);
```

### 2. Load in Main Thread

```javascript
const audioCtx = new AudioContext();

// Load the bundled worklet file
await audioCtx.audioWorklet.addModule('path/to/bundled-autotune.worklet.js');

// Create the Node
const autotuneNode = new AudioWorkletNode(audioCtx, 'autotune-processor', {
    processorOptions: {
        config: { /* ... */ },
        preset: { /* ... */ }
    }
});

// Connect
source.connect(autotuneNode).connect(audioCtx.destination);
```

### 3. Sending Events

Use the `port` to send events to the processor, which `AutotuneProcessor` listens for.

```javascript
autotuneNode.port.postMessage({
    type: 'enqueueEvents',
    events: [
        { time: audioCtx.currentTime + 0.5, note: 60, duration: 1.0 }
    ]
});
```
