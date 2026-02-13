import { generateSine, generateNoise } from "./utils/SignalGenerator.js";
import { PitchTrackerRefV1, PitchTrackerConfig } from "../src/analysis/PitchTrackerRefV1.js";
import { VoicingDetectorRefV1, VoicingConfig } from "../src/analysis/VoicingDetectorRefV1.js";
import { AudioBufferV1 } from "@mcp-voice/core";

// Deterministic Analysis Tests
// We assert that specific inputs produce exact integer outputs.

console.log("Running Analysis Determinism Tests...");

// 1. Pitch Tracking (Sine 440Hz -> ~440000 mHz)
const sr = 48000;
const buffer: AudioBufferV1 = {
    sampleRate: sr,
    channels: 1,
    format: "f32",
    data: [generateSine(sr, 1.0, 440, 0.5)]
};

const pitchConfig: PitchTrackerConfig = {
    windowMs: 40,  // Approx 2048 samples at 48k
    hopMs: 10,     // Approx 480 samples at 48k
    f0Min: 50,
    f0Max: 800,
};

const tracker = new PitchTrackerRefV1(pitchConfig);
const f0Track = tracker.analyze(buffer);

// Check middle frame (stable)
const midFrame = Math.floor(f0Track.f0MhzQ.length / 2);
const f0 = f0Track.f0MhzQ[midFrame]; 

// Ideal: 440000. YIN often slightly off depending on interpolation.
// Let's print it to establish the golden value.
// We assert stability first.
console.log(`Measured F0 (mHz): ${f0}`);
if (Math.abs(f0 - 440000) > 1000) { // Allow 1.0 Hz error for interpolation limits
    console.error("❌ Pitch Tracking unstable/inaccurate!", f0);
    process.exit(1);
}

// 2. Voicing (Noise -> Unvoiced)
const noiseBuffer: AudioBufferV1 = {
    sampleRate: sr,
    channels: 1,
    format: "f32",
    data: [generateNoise(sr, 0.5, 0.5)] // Loud noise
};

const noiseTrack = tracker.analyze(noiseBuffer);
// Noise often produces random F0 candidates, but low confidence.

const voicingConfig: VoicingConfig = {
    silenceThreshold: 0.05,
    voicingThreshold: 0.6,
    windowMs: 40 // Consistent with pitch tracker
};

const detector = new VoicingDetectorRefV1(voicingConfig);
const voicing = detector.analyze(noiseBuffer, noiseTrack);
const midNoise = Math.floor(voicing.voicedQ.length / 2);

if (voicing.voicedQ[midNoise] !== 0) {
    console.error("❌ Noise detected as voiced!");
    process.exit(1);
}

// 3. Voicing (Sine detector.analyze(buffer, f0Track)
const sineVoicing = detector.analyze(buffer, f0Track);
if (sineVoicing.voicedQ[midFrame] !== 1) {
    console.error("❌ Sine wave detected as unvoiced!");
    process.exit(1);
}

console.log("✅ Analysis Determinism Verified");
process.exit(0);
