# Invariants & Determinism

We define **Determinism** as:
> Given the same `Input State` + `Configuration` + `Module Versions`, the system produces the exact same `RenderPlan` bytes and (eventually) output audio.

## 1. The Plan is The Truth
- All decisions happen during **Planning Phase**.
- No decision is deferred to "runtime" unless it is explicitly marked as dynamic in the plan.
- The `RenderPlanV1` JSON is the system's audit log.

## 2. No Hidden Randomness
- `Math.random()` is **banned**.
- If variation is needed (e.g., "humanize" timing), it must be driven by a seeds provided in the `SynthesisRequest` or Config.
- Given the same seed, the "humanization" must be identical.

## 3. Explicit Defaults
- There is no "auto" at the bottom layer.
- "Auto" is a policy that resolves to specific numbers before execution.
- Example: `speed: "auto"` -> **RESOLVES TO** -> `speed: 1.0` (in the Plan). The Plan never says "auto".

## 4. Quantization Laws
To prevent floating point drift across architectures/languages:
- **Time**: Quantized to **4 decimal places** (0.1ms precision).
  - 1.234567s -> 1.2345s
- **Pitch**: Quantized to **3 decimal places** (1 millihertz).
- **Ratios**: Quantized to **4 decimal places**.

## 5. Canonical JSON
- All JSON output (Plans, Manifests) must be **Canonicalized**:
  - Keys sorted alphabetically.
  - Numbers formatted with consistent precision.
  - No trailing commas.
  - No optional/undefined fields output (null or omitted consistently).
