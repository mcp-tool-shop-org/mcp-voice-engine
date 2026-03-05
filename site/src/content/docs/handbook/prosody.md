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

The engine supports multiple style levels with a strict monotonicity guarantee:

```
flat < neutral < expressive
```

Higher expressivity means more pitch variation and wider dynamic range, but **never** more instability. This is verified by comparing jitter metrics across style levels.
