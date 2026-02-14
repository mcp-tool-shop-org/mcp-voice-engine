# Presets and Controls

This document outlines the safety rails, configuration presets, and control mechanisms available for the Prosody Engine.

## Safety Rails

The `SafetyRails` module provides runtime validation and clamping of configuration parameters to prevent audio artifacts.

### Key Constraints

1.  **Hysteresis**: `hysteresisCents` must be at least **5 cents**.
    *   **Reason**: Lower values cause rapid oscillation between adjacent pitch classes (warble).
    *   **Effect**: Configurations with `< 5` will be clamped to `5`.

2.  **Voicing Threshold**: `voicingThresholdQ` is clamped between **100** and **9000**.
    *   **Reason**: Too low (< 100) causes noise to be treated as voiced speech (pitch jumps). Too high (> 9000) results in dropped notes.
    *   **Effect**: Ensures reliable voicing detection.

### Expressiveness Scaling

The `applyExpressiveness(config, amount)` function allows dynamic adjustment of correction strength.

*   **Amount**: `0.0` (Strict/Robotic) to `1.0` (Natural/Expressive).
*   **Behavior**: Reduces `correctionStrength` as `amount` increases.
    *   `amount = 0.0`: Full configured correction strength.
    *   `amount = 1.0`: Zero correction strength (pass-through).

## Presets

The engine provides several built-in presets for common use cases.

| Preset | ID | Description | Key Settings |
| :--- | :--- | :--- | :--- |
| **Default Clean** | `default_clean` | Balanced correction for clear speech. | Hysteresis: 15, Ramp: 30ms |
| **Hard Tune** | `hard_tune` | Robotic, stepped pitch correction. | Hysteresis: 0*, Ramp: 5ms, Fast Attack |
| **No Warble** | `no_warble` | Conservative settings to prevent artifacts. | Hysteresis: 25, Ramp: 100ms, High Voicing Threshold |
| **Subtle** | `subtle` | minimal correction for natural enhancement. | Strength: 0.3 |

*\* Note: `hysteresisCents` of 0 in Hard Tune will be clamped to 5 by Safety Rails.*

## Configuration Knobs

### Stabilizer (Pitch Quantization)
*   **`hysteresisCents`**: Width of the "sticky" region around a target note. Higher = more stability, less agility.
*   **`switchRampMs`**: Duration of the crossfade when switching notes. Higher = smoother, slower.
*   **`minHoldMs`**: Minimum time to hold a note before switching. Prevents rapid trilling.

### Analysis (Voicing)
*   **`voicingThresholdQ`**: Confidence required to treat audio as voiced. format: Q14 fixed point (0-16384 typically, but 2000 is default).

### Global
*   **`correctionStrength`**: 0.0 to 1.0 scale factor for the overall correction envelope.
*   **`attackMs` / `releaseMs`**: Envelope follower timing.

## Usage Example

```typescript
import { PRESETS, validateAndClampConfig, applyExpressiveness } from '@mcptoolshop/voice-engine-dsp';

// Start with a preset
let config = PRESETS.DEFAULT_CLEAN;

// Apply expressiveness (user control)
config = applyExpressiveness(config, 0.5); // 50% strength

// Validate before use
config = validateAndClampConfig(config);

// Use in engine
engine.configure(config);
```

