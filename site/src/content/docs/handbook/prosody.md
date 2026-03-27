---
title: Prosody Controls
description: Expressive accents, boundary tones, and meaning tests.
sidebar:
  order: 3
---

MCP Voice Engine provides event-driven prosody controls that shape cadence and intonation intentionally — without destabilizing pitch targets.

## Expressive prosody

Accents and boundary tones are applied as discrete events, not global style knobs. This lets you shape specific words or phrases while keeping the rest of the utterance stable.

Key properties enforced by the test suite:

| Behavior | What it means |
|----------|---------------|
| Accent locality | Accents affect only the target pitch region — no smear into adjacent syllables |
| Question vs statement | Rising boundary tone for questions, falling for statements — reliably distinct |
| Post-focus compression | Focus events have consequences — compressed pitch range after the focal word |
| Deterministic event ordering | Same prosody event sequence always produces the same pitch curve |
| Style monotonicity | Expressivity increases (expressive > neutral > flat) without increasing instability |

## Meaning tests

The test suite goes beyond "does it run" to enforce **communicative behavior**. These are semantic guardrails that verify the engine produces musically and linguistically meaningful output.

Each meaning test checks a specific communicative property:

- **Accent locality** — an accent on word 3 should not affect the pitch of word 1 or word 5
- **Question rise** — a question boundary tone should produce measurably higher terminal pitch than a statement
- **Post-focus compression** — words after a focus event should have a narrower pitch range
- **Event ordering** — given the same event sequence, the output must be bit-identical
- **Style monotonicity** — increasing expressivity should increase pitch variation without increasing jitter

## Style levels

The engine ships four built-in prosody styles, each defining accent range, boundary strength, event scaling, residual mix, and post-focus compression:

| Style | Accent range | Boundary range | Event scale | Residual mix | PFC |
|-------|-------------|----------------|-------------|-------------|-----|
| `robot_flat` | 0 cents | 0 cents | 0.0 | 0.0 | 0.0 |
| `speech_neutral` | 600 cents | 400 cents | 1.0 | 1.0 | 0.2 |
| `speech_expressive` | 900 cents | 500 cents | 1.2 | 1.0 | 0.5 |
| `pop_tight` | 400 cents | 200 cents | 0.8 | 0.3 | 0.1 |

Monotonicity is enforced: `flat < neutral < expressive` in pitch variation, but **never** in instability. The test suite compares jitter metrics across style levels to verify this.

## Presets

Built-in presets in `voice-engine-dsp` offer ready-to-use configurations:

| Preset | Correction | Hysteresis | Ramp | Use case |
|--------|-----------|------------|------|----------|
| `DEFAULT_CLEAN` | 1.0 | 15 cents | 30 ms | Balanced everyday correction |
| `HARD_TUNE` | 1.0 | 0 cents (clamped to 5) | 5 ms | Robotic T-Pain effect |
| `NO_WARBLE` | 1.0 | 25 cents | 100 ms | Conservative, artifact-free |
| `SUBTLE` | 0.3 | default | default | Natural enhancement |

The `voice-engine-core` package provides additional named presets (`HARD_TUNE_PRESET`, `NATURAL_PRESET`, `SUBTLE_PRESET`) with full analysis, stabilizer, and tuning configs. Use `normalizePreset()` to merge partial overrides with safe defaults.

## Safety rails

`validateAndClampConfig()` prevents dangerous configurations:

- Hysteresis below 5 cents is clamped to 5 (prevents rapid pitch oscillation/warble)
- Voicing threshold is clamped to the 100--9000 range (prevents classifying everything or nothing as voiced)

`applyExpressiveness(config, amount)` scales correction strength inversely with expressiveness: amount 0.0 keeps full correction, amount 1.0 reduces correction to zero.

## Prosody events

Events are discrete instructions applied to the pitch curve. Each event has a type, time (frame index), strength (0--1), shape, and optional span:

| Type | Effect |
|------|--------|
| `accent` | Raises or lowers pitch at a target frame using a raised cosine window |
| `boundary` | Terminal pitch inflection (rising for questions, falling for statements) |
| `reset` | Resets prosody state |
| `deaccent` | Suppresses pitch movement in a region |

Event shapes (`rise`, `fall`, `rise-fall`, `fall-rise`) control the direction of the pitch excursion. Events can be scoped to a voiced segment or an entire phrase, and clamped with a hard cutoff or a gradual fade.
