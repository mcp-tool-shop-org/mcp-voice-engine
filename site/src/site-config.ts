import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'MCP Voice Engine',
  description: 'Streaming TTS inference backend — powers mcp-voice-soundboard — Kokoro/Piper synthesis, zero-copy PCM.',
  logoBadge: 'VE',
  brandName: 'mcp-voice-engine',
  repoUrl: 'https://github.com/mcp-tool-shop-org/mcp-voice-engine',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Deterministic · Streaming-first · Zero-copy PCM',
    headline: 'Voice DSP that behaves like',
    headlineAccent: 'software, not folklore.',
    description: 'Streaming TTS inference backend with Kokoro/Piper synthesis, expressive prosody controls, and deterministic output. Powers mcp-voice-soundboard.',
    primaryCta: { href: '#quickstart', label: 'Quick start' },
    secondaryCta: { href: '#capabilities', label: 'See capabilities' },
    previews: [
      { label: 'Install', code: 'npm i && npm run build' },
      { label: 'Test', code: 'npm test\nnpm run test:meaning\nnpm run test:determinism' },
      { label: 'Bench', code: 'npm run bench:rtf\nnpm run smoke' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'capabilities',
      title: 'Core Capabilities',
      subtitle: 'Built for stability and reproducibility — the two places most voice DSP systems fail.',
      features: [
        {
          title: 'Deterministic Output',
          desc: 'Same input + config + chunking policy produces identical output every time. Regression-protected via hash-based tests — not "it sounds about right".',
        },
        {
          title: 'Streaming-First Runtime',
          desc: 'Stateful, causal processing designed for low latency. No retroactive edits. Snapshot/restore for persistence and resumability across connections.',
        },
        {
          title: 'Expressive Prosody',
          desc: 'Event-driven accents and boundary tones shape cadence and intonation intentionally. Meaning tests enforce accent locality, question vs statement boundaries, and post-focus compression.',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'meaning-tests',
      title: 'Meaning Tests',
      subtitle: 'The test suite enforces communicative behavior — not just "does it run".',
      columns: ['Test', 'What it enforces'],
      rows: [
        ['accent locality', 'Accents affect the target pitch region only — no smear into adjacent syllables'],
        ['question vs statement', 'Rising boundary tone for questions, falling for statements — reliably distinct'],
        ['post-focus compression', 'Focus events have consequences — compressed range after the focal word'],
        ['deterministic event ordering', 'Same prosody event sequence always produces the same pitch curve'],
        ['style monotonicity', 'expressive > neutral > flat — without increasing instability at higher expressivity'],
      ],
    },
    {
      kind: 'data-table',
      id: 'packages',
      title: 'Packages',
      subtitle: 'Monorepo — one package today, clean separation for future synthesis backends.',
      columns: ['Package', 'Contents'],
      rows: [
        ['packages/voice-engine-dsp', 'Core DSP + streaming prosody engine, meaning tests, determinism tests, RTF benchmarks'],
      ],
    },
    {
      kind: 'code-cards',
      id: 'quickstart',
      title: 'Quick Start',
      cards: [
        {
          title: 'Build & test',
          code: `git clone https://github.com/mcp-tool-shop-org/mcp-voice-engine
cd mcp-voice-engine
npm i
npm run build

# Full test suite
npm test

# Specific suites
npm run test:meaning       # communicative behavior
npm run test:determinism   # hash regression tests
npm run bench:rtf          # real-time factor benchmark
npm run smoke              # end-to-end smoke test`,
        },
        {
          title: 'Key docs',
          code: `packages/voice-engine-dsp/docs/
├── STREAMING_ARCHITECTURE.md  # causal processing model
├── MEANING_CONTRACT.md        # prosody behavior spec
└── DEBUGGING.md               # debugging guide

Reference_Handbook.md          # full API + concepts reference
PERF_CONTRACT.md               # RTF and latency guarantees`,
        },
      ],
    },
  ],
};
