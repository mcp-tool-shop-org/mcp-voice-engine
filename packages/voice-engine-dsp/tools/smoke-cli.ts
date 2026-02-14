#!/usr/bin/env node
import { StreamingAutotuneEngine } from '../src/tuning/StreamingAutotuneEngine';
import { PROSODY_API_VERSION } from '../src/version';
import * as crypto from 'crypto';

function generateSineWave(durationSec: number, freqHz: number, sampleRate: number): Float32Array {
  const length = Math.floor(durationSec * sampleRate);
  const buffer = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    buffer[i] = Math.sin(2 * Math.PI * freqHz * t);
  }
  return buffer;
}

try {
  console.log(`Prosody Engine v${PROSODY_API_VERSION}: Starting Smoke Test...`);

  const config = {
    silenceThresholdDb: -60,
    voicingThresholdQ: 2000,
    rootOffsetCents: 0,
    allowedPitchClasses: [0, 2, 4, 5, 7, 9, 11] // C Major
  };
  
  const preset = {
      name: "SmokeTestDefault"
  };

  const engine = new StreamingAutotuneEngine(config, preset);

  // set mock pitch to match our sine wave
  const pitchHz = 440;
  engine.setMockPitch(pitchHz);

  const sampleRate = 44100;
  const buffer = generateSineWave(1.0, pitchHz, sampleRate);
  
  const output = engine.process(buffer);
  
  if (!output || !output.audio || !output.targets) {
      throw new Error("Engine returned invalid output structure.");
  }

  // Calculate determinism hash (simple checksum of targets)
  // We use targets because audio might just be a copy or depend on other things, 
  // but targets are the result of the logic.
  let sum = 0;
  for(let i=0; i<output.targets.length; i++) {
      sum += output.targets[i];
  }
  
  // A simple hash string
  const hash = crypto.createHash('sha256').update(new Uint8Array(output.targets.buffer)).digest('hex').substring(0, 8);
  
  console.log(`Prosody Engine v${PROSODY_API_VERSION}: OK`);
  console.log(`Determinism Hash: ${hash}`);

} catch (e) {
  console.error(`Prosody Engine v${PROSODY_API_VERSION}: FAIL`);
  console.error(e);
  process.exit(1);
}
