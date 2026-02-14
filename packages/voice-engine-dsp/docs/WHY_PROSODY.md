# Why Prosody Engine Exists

## The Problem: The "Robot" Effect
Most traditional text-to-speech and autotune systems treat pitch as a single, smooth value ($F_0$). They perform "naive" correction or synthesis that snaps perfectly to a grid.

This fails because human speech is messy:
- **Micro-prosody**: Small pitch jitters caused by consonant obstruction.
- **Drift**: Humans rarely hold a perfect 440Hz note; they drift around it.
- **Phrasing**: The "melody" of speech (intonation) carries as much meaning as the words themselves.

When you remove these imperfections, you get the "Cher effect" or robotic flatness.

## Our Solution: Engineering Empathy
Prosody Engine is designed to solve this by treating voice not just as a signal to be corrected, but as a system to be modeled.

### 1. Deterministic Control
We built a DSP pipeline that is 100% deterministic. Input A always equals Output B. This eliminates the "automagic" black-box behavior of VST plugins, allowing for rigorous regression testing and confident deployment in production systems.

### 2. Streaming-First
Latency is the enemy of interaction. We architected the system from the ground up for low-latency streaming (Voice Changers, Real-time TTS), using zero-allocation strategies on the hot path.

### 3. Vocology-Grounded ("No Warble")
We adhere to the "No Warble" mantra:
> If confidence is low, do not correct.

Our algorithms are informed by the physiology of the vocal tract (Source-Filter model), ensuring that pitch shifts do not destroy the formant envelope (vowel identity) or introduce unnatural artifacts in unvoiced segments.

## Meaning Tests
We don't just test if the code runs; we test if it *sounds* right. Our "Meaning Tests" verify that:
- A "Sad" setting actually lowers dynamic range.
- A "Question" setting actually raises the final boundary tone.
- Unvoiced consonants remain unshifted.
