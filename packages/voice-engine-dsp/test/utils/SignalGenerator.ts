// Deterministic Signal Generators

export class LCG {
  private state: number;
  constructor(seed: number = 12345) { this.state = seed; }
  
  nextFloat(): number {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return (this.state / 4294967296) * 2 - 1;
  }
}

export function generateSine(
  sampleRate: number,
  durationSec: number,
  freq: number = 440,
  amp: number = 0.5
): Float32Array {
  const length = Math.floor(sampleRate * durationSec);
  const buffer = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    buffer[i] = amp * Math.sin(2 * Math.PI * freq * (i / sampleRate));
  }
  return buffer;
}

export function generateNoise(
  sampleRate: number,
  durationSec: number,
  amp: number = 0.1
): Float32Array {
  const length = Math.floor(sampleRate * durationSec);
  const buffer = new Float32Array(length);
  const lcg = new LCG(42);
  for (let i = 0; i < length; i++) {
    buffer[i] = lcg.nextFloat() * amp;
  }
  return buffer;
}
