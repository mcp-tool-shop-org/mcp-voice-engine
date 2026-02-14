# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-14

### Added
- **Streaming-First Architecture**: `StreamingAutotuneEngine` with zero-allocation hot paths.
- **Deterministic Pipeline**: Frame-perfect reproducibility in `AutotuneExecutor`.
- **Meaning Tests**: Initial suite of vocology-based conformance tests.
- **Event System**: Real-time injection of pitch accents and boundary tones.

### Changed
- Refactored `TunePlanResolver` to use Q-format fixed-point math for consistency.
- Updated `PitchShifterRefV1` to support formant-aware shifting strategies.

### Fixed
- Latency issues in ring buffer management for real-time processing.
- Confidence gating artifacts in low-SNR environments ("No Warble" compliance).
