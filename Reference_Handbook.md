# Vocology & Prosody Reference Handbook

Synthesized from Reference Packs v0.1, v0.2, v0.3.

---\n
## README

# Vocology & Prosody Reference Pack (v0.2)

Deep-dive, *engineering-oriented* notes on vocology (voice science/practice) and prosody (rhythm/intonation/stress),
aimed at building reliable DSP + ML systems (autotune, expressivity, analysis, TTS control).

Not medical advice.

Built: 2026-02-14T02:38:10.371917Z

## Folders
- `01_foundations/` — key concepts and mental models
- `02_physiology/` — vocal system anatomy/physiology for engineers
- `03_acoustics/` — acoustic correlates and measurable features
- `04_prosody/` — timing, intonation, stress, phrasing, prominence
- `05_voice_quality/` — breathy/creaky/pressed, resonance, formants, spectral tilt
- `06_measurement/` — measurement methods, pitfalls, recommended metrics
- `07_models_and_algorithms/` — pitch/voicing, smoothing, hysteresis, note tracking
- `08_applications/` — autotune humanization, formant strategies, expressive control
- `09_bibliography/` — canonical sources + search terms

## Engineering mantra
**No Warble** = confidence-gated correction + smoothing + hysteresis + (optional) vibrato preservation.


---

## INDEX

# Index

Start with:
- `01_foundations/01_what_is_vocology.md`
- `01_foundations/02_what_is_prosody.md`

Then the “make it not embarrassing” core:
- `06_measurement/02_voicing_and_confidence.md`
- `07_models_and_algorithms/01_f0_smoothing_and_hysteresis.md`
- `08_applications/01_autotune_humanization.md`

Deep modules:
- `07_models_and_algorithms/02_microprosody.md`
- `07_models_and_algorithms/03_note_tracking_for_singing.md`
- `08_applications/02_formant_preservation_strategies.md`


---


## 01_foundations\01_what_is_vocology.md

# What is vocology?

**Vocology** studies how voices are produced, trained, used, and sometimes rehabilitated.
For engineers it’s a map from **control variables** (breath pressure, vocal fold closure, tract shaping)
to **acoustic outputs** (F0, formants, tilt, noise) and **perceptual qualities** (brightness, effort, breathiness).

## Why DSP/ML people should care
Pitch correction and expressivity systems fail when they ignore:
- voicing confidence (unvoiced frames *must not* be tuned),
- consonants/noise handling,
- vibrato and glides,
- formants / spectral envelope.

Vocology gives you the failure modes to test for.

## Source–filter model (useful approximation)
1) **Source** (larynx): periodic pulses (voiced) or turbulence (unvoiced), plus intensity/tilt  
2) **Filter** (vocal tract): resonances (formants), antiresonances (nasal coupling)  
3) **Radiation + chain**: mouth radiation, room, mic, compression



---


## 01_foundations\02_what_is_prosody.md

# What is prosody?

**Prosody** is the patterning of speech over time:
- **Intonation**: pitch movement (F0 contours)
- **Rhythm**: timing patterns, tempo, duration
- **Stress/Prominence**: what stands out (pitch + intensity + duration bundle)
- **Phrasing**: grouping with boundary cues (pauses, lengthening, pitch reset)

Prosody encodes meaning beyond words: emphasis, questions, turn-taking, attitude.

Engineering consequence: prosody control is *multi-parameter*; pitch alone is rarely enough.



---


## 02_physiology\01_source_filter.md

# Source–filter model (engineering summary)

Speech ≈ Source (glottal excitation) passed through Filter (vocal tract resonances).

Practical implications:
- Pitch shifting changes harmonic spacing (source).
- Vowels are largely defined by formants (filter).
- Shift F0 without envelope/formant handling → “chipmunk/giant” vowels.

Source controls (simplified):
- subglottal pressure → loudness/energy
- adduction/closure → breathy ↔ pressed continuum
- pulse shape → spectral tilt (abrupt closure => more high harmonics)

Filter controls:
- tongue height/frontness → F1/F2
- lip rounding → lowers formants
- nasal coupling → antiresonances + spectral shaping



---


## 02_physiology\02_laryngeal_behaviors.md

# Laryngeal behaviors & voice qualities (non-clinical)

## Breathy
Incomplete closure; more turbulent airflow.
Acoustics: higher noise floor, steeper spectral tilt, lower harmonicity (HNR).

## Pressed / strained
Strong closure; more high-frequency harmonics, flatter tilt; can push nonlinearities.
Perception: “edge”, effort.

## Creaky / fry
Irregular low-frequency pulses; subharmonics; unstable period.
Pitch trackers often fail here → confidence gating matters.

## Falsetto
Different vibratory mode; fewer strong harmonics; often breathier.

Engineering note: a pitch tracker without confidence is a warble generator.



---


## 03_acoustics\01_pitch_vs_f0.md

# Pitch vs F0

**F0** is physical periodicity. **Pitch** is perceptual. They correlate, but diverge when:
- the fundamental is weak/missing (missing fundamental illusion),
- strong harmonics dominate,
- noise is high,
- polyphonic/instrumental leakage exists,
- the signal is inharmonic.

For correction: do not trust raw F0 without confidence + continuity.

## Cents
`cents = 1200 * log2(f2 / f1)`
100 cents = 1 semitone (equal temperament)



---


## 03_acoustics\02_formants_and_vowels.md

# Formants & vowels

Formants (F1/F2/…) are vocal tract resonances shaping vowels.

Trends:
- higher tongue → lower F1
- more front tongue → higher F2
- lip rounding → lowers formants

Pitch shifting changes harmonic spacing; if you don’t preserve envelope/formants,
vowels can morph and identity shifts.

Common implementation families:
- LPC envelope extraction + resynthesis
- phase vocoder with envelope constraints (cepstral liftering)
- PSOLA variants + envelope handling
- WORLD-style decomposition (F0, envelope, aperiodicity)



---


## 03_acoustics\03_cpp_hnr_jitter_shimmer.md

# CPP, HNR, Jitter, Shimmer (features with failure modes)

## HNR — Harmonic-to-Noise Ratio
Proxy for periodicity vs noise.
Good for voicing confidence and “No Warble” gating.
Failure: mic/room noise, fricatives, windowing can distort.

## CPP — Cepstral Peak Prominence
Measures prominence of periodicity peak in the cepstrum.
Useful periodicity indicator under mild noise.
Failure: sensitive to signal chain processing, short windows, extremes.

## Jitter/Shimmer
Cycle-to-cycle period / amplitude variation.
Failure: requires reliable cycle detection; brittle in breathy/creaky/noisy segments.

Engineering recommendation:
Use a robust multi-cue confidence measure; treat jitter/shimmer-like signals as auxiliary flags.



---


## 04_prosody\01_intonation_contours.md

# Intonation contours (speech melody)

Simplified English-ish patterns:
- declarative: gradual declination + final fall
- yes/no question: final rise
- continuation: phrase-final rise/level, not fully falling

Model F0 as layered structure:
1) micro-prosody (consonant perturbations)
2) accent targets (local rises/falls)
3) phrase baseline (declination + boundary resets)

For synthesis/control: separating layers yields more natural behavior than a single curve.



---


## 04_prosody\02_rhythm_timing.md

# Rhythm, timing, prominence

Prominence bundle:
- increased duration
- increased intensity
- pitch movement or local peak
- sometimes spectral tilt shift (effort/brightness)

Boundary cues:
- pre-boundary lengthening
- pause
- pitch reset or boundary tones

Engineering metrics:
- pause distribution
- syllable-nucleus energy peaks vs timing
- F0 peak alignment with nuclei



---


## 04_prosody\03_prominence_and_focus.md

# Prominence, focus, information structure

Focus (contrast/emphasis) often expressed by:
- local pitch accent
- duration + intensity increase
- post-focus compression (reduced pitch range after focus)

Detection sketch:
Prominence score ≈ z(intensity) + z(duration proxy) + z(|F0 slope|)

TTS control implication:
Better than one “emphasis” knob:
- emphasis strength
- accent type (rise/fall)
- timing within word
- post-focus compression strength



---


## 04_prosody\04_phrase_boundaries.md

# Phrase boundaries: cues and detection

Cues:
- pauses (or micro-pauses)
- pre-boundary lengthening
- pitch reset
- intensity pattern changes

Why it matters:
- smoothing across boundaries smears meaning and causes artifacts
- phrase segmentation is a natural place to reset filters and tuning plans

Detection ideas:
- energy + silence detection with hysteresis
- local speaking-rate change
- F0 declination reset events



---


## 05_voice_quality\01_spectral_tilt.md

# Spectral tilt and perceived effort

Spectral tilt: how quickly harmonic magnitudes fall with frequency.

- Abrupt closure → more high-frequency energy → flatter tilt → “brighter/edgier”
- Breathy phonation → steeper tilt + more noise

Measures (approximate):
- H1-H2
- H1-A2
- harmonic slope across bands

Caution: formants complicate tilt measurement; validate with controlled signals.



---


## 06_measurement\01_pitch_tracking_methods.md

# Pitch tracking methods (and their betrayals)

- Autocorrelation: simple, octave errors possible
- YIN / pYIN: strong baselines with continuity advantages
- Cepstrum: robust periodicity cue; can confuse with formants
- HPS: reinforces fundamentals but can be brittle

Practical advice:
- always compute confidence
- enforce continuity (don’t tune frame-by-frame independently)
- treat creaky/breathy/noisy segments as “special”



---


## 06_measurement\02_voicing_and_confidence.md

# Voicing detection & confidence gating (“No Warble”)

Rule:
> If confidence is low, do not correct (or smoothly decay correction to 0).

Support for voicing:
- strong periodicity peak (YIN CMND, autocorr peak, CPP proxy)
- harmonic structure / harmonicity
- stable inter-frame pitch
- sufficient energy

Reduce confidence for:
- broadband noise bursts (fricatives, breath)
- low energy
- irregular pulses (creak)
- multiple competing pitch candidates

Engineering pattern:
- compute f0 + confidence
- `is_voiced = confidence >= minConfidence`
- if unvoiced: shift = 0 (or decay)
- else: apply controlled correction



---


## 06_measurement\03_feature_extraction_checklist.md

# Feature extraction checklist (DSP pipelines)

Preprocessing:
- DC removal
- optional gentle HPF (50–80 Hz) to reduce rumble
- avoid nonlinear limiting if you care about CPP/HNR stability

Windows:
- 20–50 ms frames, 5–10 ms hop (typical)
- treat voiced/unvoiced segments differently

Core features:
- F0 + confidence
- RMS/energy envelope
- harmonicity proxy (HNR-ish)
- spectral centroid/rolloff (brightness proxies)
- tilt proxy

Pitfalls:
- features are not “truth”
- maintain synthetic-signal unit tests: pure tone, harmonic stack, vibrato FM, noise bursts, missing fundamental



---


## 07_models_and_algorithms\01_f0_smoothing_and_hysteresis.md

# F0 smoothing & hysteresis for musical stability

Autotune artifacts happen when correction follows micro-jitter.

Tools:
- median filter (kill spikes)
- EMA smoothing (control lag)
- asymmetric attack/release smoothing on *applied correction*
- hysteresis around quantization boundaries (prevents chatter)

Boundary chatter:
When pitch hovers near a semitone boundary, naive snapping oscillates between notes.
Hysteresis: commit to a note until you cross a threshold beyond the boundary.



---


## 07_models_and_algorithms\02_microprosody.md

# Microprosody (consonant-induced perturbations)

Consonants can systematically perturb F0:
- voiceless consonants often disrupt/depress F0
- transitions can induce local bumps/dips

Why it matters:
Naive correction “fixes” these perturbations → unnatural motion and warble.

Strategies:
- confidence gate around unvoiced consonants
- emphasize correction on vowel nuclei
- decompose F0 into slow trend + fast residual
  - quantize/correct the trend
  - preserve residual (vibrato + microprosody)



---


## 07_models_and_algorithms\03_note_tracking_for_singing.md

# Note tracking for singing (monophonic) — beyond raw F0

Singing includes vibrato, portamento, ornamentation, scoops/falls.
A note tracker infers intended *discrete targets* + transitions.

Deterministic sketch:
1) frame-wise F0 + confidence
2) convert to cents
3) smooth within voiced spans
4) segment into plateaus vs transitions (variance + slope)
5) quantize plateaus with hysteresis
6) during transitions, optionally reduce correction (preserve glide)

Metrics:
- note onset/offset timing error
- cent error on plateaus
- transition naturalness (avoid staircase)



---


## 08_applications\01_autotune_humanization.md

# Autotune humanization (deterministic edition)

Human pitch is not a straight line. Humanization aims to:
- preserve vibrato
- avoid instant snapping
- avoid robotic cent perfection
- keep boundaries stable (no chatter)

Deterministic humanization:
- any randomness must be seeded
- derive micro-variation from stable indices or explicit seed

Levers:
- strength (blend)
- attack/release smoothing on applied correction
- hysteresis
- confidence gate (No Warble)
- vibrato preservation: correct the *center*, not the oscillation



---


## 08_applications\02_formant_preservation_strategies.md

# Formant preservation strategies (overview)

Goal: pitch-shift source periodicity while keeping spectral envelope (formants) stable.

Families:
A) PSOLA-like: natural for small shifts; needs good period detection; struggles with noise/large shifts
B) Phase vocoder + envelope constraints: flexible; can be “phasier” if not tuned
C) LPC envelope remove/restore: explicit control; brittle under noise/high pitch
D) WORLD-style decomposition: strong separation; may introduce vocoder character

Rule:
Decide target use-case first: speech micro-correction vs singing wide ranges vs deliberate voice transformation.



---


## 09_bibliography\01_canonical_sources.md

# Canonical sources (non-exhaustive)

Books / foundational:
- Johan Sundberg — *The Science of the Singing Voice*
- Ingo Titze — *Principles of Voice Production* (and related work)
- Acoustic phonetics texts (e.g., Ladefoged & others)
- Intonation/prosody literature (AM theory, ToBI systems)

Tools:
- Praat (analysis)
- parselmouth (Python interface to Praat)
- librosa, pyworld, WORLD vocoder ecosystem
- pYIN/YIN implementations

Concepts worth studying:
- ToBI (Tone and Break Indices)
- CPP/CPPS, HNR
- Glottal inverse filtering, LF model
- Vibrato rate/extent, portamento modeling



---


## 09_bibliography\02_search_terms_and_topics.md

# Search terms & topics (for deeper literature pulls)

Prosody:
- autosegmental-metrical (AM) theory
- ToBI, boundary tones, pitch accents
- declination, downstep, pitch reset
- post-focus compression

Voice source:
- LF model (Liljencrants–Fant)
- open quotient, speed quotient
- H1-H2, H1-A2 (tilt measures)
- glottal inverse filtering

Pitch tracking:
- YIN, pYIN, SWIPE, RAPT
- voicing decision, confidence measures

Formants:
- LPC formant tracking pitfalls
- nasalization antiresonances

Singing:
- note onset detection
- vibrato estimation (rate/extent)
- portamento segmentation



---


## Update Log (v0.3)

# Changelog

## v0.3 — 2026-02-14
Added expanded notes.


---

# Part II: Advanced Topics & Research Synthesis

## 10_psychoacoustics\01_emotional_prosody.md

# Emotional Prosody: Mapping Acoustics to Affect

To generate or analyze expressive speech, we must map abstract emotional labels (e.g. "Anger", "Joy") to concrete acoustic modifications.

## The Core Features
1.  **F0 Mean**: Overall pitch height. High = Arousal/Submission. Low = Dominance/Calm.
2.  **F0 Range**: Dynamic range of pitch. Wide = Expressive/Emotional. Narrow = Depressed/Bored.
3.  **Speech Rate**: Tempo. Fast = Anger/Joy/Fear. Slow = Sadness/Boredom.
4.  **Intensity/Loudness**: Energy. High = Anger/Joy. Low = Sadness/Fear.
5.  **Spectral Tilt**: Voice quality. Flatter (more high freq) = Anger/Joy (Tenseness). Steeper (darker) = Sadness (Laxness).

## Affect Mapping Table

| Emotion | F0 Mean | F0 Range | Tempo | Intensity | Voice Quality |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Anger** (Hot) | High | Wide | Fast | High | Tense, Breathy (if suppressed) |
| **Joy** | High | Wide | Fast | High | Bright, Tense |
| **Sadness** | Low | Narrow | Slow | Low | Dark, Lax, Breathy |
| **Fear** | High | Wide | Fast | Var | Tremor/Jitter, Breathy |
| **Boredom** | Low | Narrow | Slow | Low | Flat, Monotone |
| **Disgust** | Low | Wide | Slow | Low | Creaky, Pharyngealized |

## Engineering Implication
For an "Expressive" mode in a synthesizer or voice changer:
- **Excite/Hype**: Shift F0 up +10%, Expand Dynamic Range +20%, Tilt +3dB/oct (brighten).
- **Soothe/Calm**: Shift F0 down -5%, Compress Range -10%, Tilt -3dB/oct (darken), Slow down.

---

## 11_interaction\01_conversational_prosody.md

# Conversational Prosody: Turn-Taking & Backchannels

Human interaction relies on prosodic cues to manage "who speaks when". Violating these causes interruptions or awkward silences.

## Turn-Yielding Cues (I am done speaking)
1.  **Phrase-Final Lengthening**: The last syllable is significantly longer (1.5x - 2x).
2.  **Pitch Boundary Tone**:
    - **L-L% (Low Drop)**: Declarative, finished. "I am going home." (Home drops low).
    - **L-H% (High Rise)**: Question/Uncertainty. "Are you going home?" (Home rises).
3.  **Intensity Drop**: Trail off volume at the end.

## Turn-Holding Cues (I am thinking, don't interrupt)
1.  **Flat Intonation**: Holding a pitch steady while pausing.
2.  **Glottalization**: Creaky voice or glottal stop during a hesitation ("Uh...").
3.  **Inhalation**: Audible breath indicates preparation to speak.

## Backchannels (Feedback)
Short utterances ("Mmhmm", "Yeah", "Right") that do NOT take the turn.
- **Continuers**: Rising pitch ("Uh-huh?"). Signals "Keep going".
- **Assessments**: Falling pitch ("Oh wow."). Signals "I understand/agree".

---

## 12_voice_modes\01_spectral_shaping.md

# Advanced Vocal Modes: Spectral Shaping

Beyond basic Source-Filter, distinct "Vocal Modes" (concepts from Estill/CVT) drastically change the spectral envelope.

## 1. Twang (Speaker's Ring)
- **Mechanism**: Narrowing of the Aryepiglottic Sphincter (AES).
- **Acoustic Effect**: A massive boost in the 2-4kHz range (Singer's Formant region).
- **Perception**: "Piercing", "Bright", "Nasal" (though not actually nasal), "Loud".
- **DSP Simulation**: Peaking EQ at 3kHz, Q=1.5, +6dB to +12dB.

## 2. Sob / Cry
- **Mechanism**: Lowered larynx, expanded pharynx.
- **Acoustic Effect**: All formants shift down (Longer vocal tract). Reduced measurement of F3/F4/F5.
- **Perception**: "Dark", "Operatic", "Sad", "Round".
- **DSP Simulation**: Formant shift -10% to -15%. Shelf EQ cut > 2kHz.

## 3. Belting
- **Mechanism**: High subglottal pressure, thick fold mass, high larynx.
- **Acoustic Effect**: High dominance of the First Harmonic (H1) is REDUCED, Second Harmonic (H2) and higher are boosted. Strong metallic energy.
- **DSP Simulation**: Saturation (odd harmonics), Compression (fast attack), EQ boost 1-3kHz.

---

## 13_algorithms\01_random_walk_humanization.md

# The "Uncanny Valley" of Pitch Correction

Perfect quantization (Snap=100%, 0ms Glide) sounds robotic because human pitch is never perfectly constant.

## Natural Drift Models
Humans drift around the target pitch.
- **Static Drift**: Off-center tuning (e.g. sharp by 5 cents).
- **Dynamic Drift**: Random walk (Brownian motion) or 1/f Noise (Pink Noise).

## 1/f Noise (Pink Noise) vs White Noise
- **White Noise**: Too jittery. Sounds like synthesis artifacts.
- **1/f Noise**: Correlated randomness. "Wanders" naturally.

## Algorithm: Natural Vibrato Injection
If the input is too straight (flatline pitch), it sounds synthetic.
1.  **LFO**: Sine wave ~5-6Hz.
2.  **Jitter**: Modulate the LFO rate slightly (4.8Hz - 6.2Hz).
3.  **Amplitude**: Modulate depth (fade in at start of note, fade out at end).

## Hysteresis & Note Stability
Do not switch notes if the input is only briefly in the new zone.
- **Rule**: Must stay in new note range for > `T_hysteresis` (e.g. 40ms) OR exceed `Energy_threshold`.
- Prevents "yodeling" artifacts on noisy input.

---

