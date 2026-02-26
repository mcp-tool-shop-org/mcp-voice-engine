<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-voice-engine/readme.png" alt="MCP Voice Engine" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-voice-engine/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/mcp-tool-shop-org/mcp-voice-engine/ci.yml?branch=main&style=flat-square&label=CI" alt="CI"></a>
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-voice-engine/readme.png" alt="Node.js 20+">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/mcp-voice-engine?style=flat-square" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-voice-engine/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
</p>

# MCP Voice Engine

> Parte di [MCP Tool Shop](https://mcptoolshop.com)

Motore prosodico deterministico, progettato per lo streaming, per la sintesi vocale espressiva, il controllo dell'intonazione e la trasformazione vocale in tempo reale.

## Perché questo progetto esiste

La maggior parte dei sistemi DSP vocali fallisce in due aree: **stabilità** (vibrazioni, tremolii, fluttuazioni dell'intonazione) e **riproducibilità** ("si verifica solo a volte"). MCP Voice Engine è progettato per essere musicale, causale e deterministico, quindi si comporta come un software, non come una leggenda.

## Cosa si può creare con esso

*   **Stilizzazione vocale in tempo reale** per giochi e applicazioni interattive (obiettivi stabili, controlli espressivi)
*   **Pipeline vocali in streaming** (server, bot, elaborazione in diretta)
*   **Integrazione con DAW / toolchain** (obiettivi di intonazione deterministici, comportamento di rendering coerente)
*   **Demo Web Audio** (architettura pronta per AudioWorklet)

## Guida introduttiva

```bash
npm i
npm run build
npm test
```

## Funzionalità principali

### Output deterministico
Lo stesso input + configurazione (e politica di suddivisione) produce lo stesso output, con protezione dalle regressioni tramite test basati su hash.

### Runtime orientato allo streaming
Elaborazione con stato e causale, progettata per bassa latenza. Nessuna modifica retroattiva. Supporto per snapshot/ripristino per persistenza e ripresa.

### Controlli prosodici espressivi
Accenti e toni di confine guidati da eventi consentono di modellare il ritmo e l'intonazione in modo intenzionale, senza destabilizzare gli obiettivi di intonazione.

### Test semantici (vincoli semantici)
La suite di test impone un comportamento comunicativo, tra cui:
*   **località degli accenti** (nessun "effetto di sfocatura")
*   **distinzione tra domande e affermazioni** (innalzamento vs. abbassamento)
*   **compressione post-enfasi** (l'enfasi ha delle conseguenze)
*   **ordinamento deterministico degli eventi**
*   **monotonicità dello stile** (espressivo > neutro > piatto senza aumentare l'instabilità)

## Documentazione

La documentazione principale si trova in [packages/voice-engine-dsp/docs/](packages/voice-engine-dsp/docs/).

### Documenti chiave

*   [Architettura di streaming](packages/voice-engine-dsp/docs/STREAMING_ARCHITECTURE.md)
*   [Contratto semantico](packages/voice-engine-dsp/docs/MEANING_CONTRACT.md)
*   [Guida al debug](packages/voice-engine-dsp/docs/DEBUGGING.md)
*   [Manuale di riferimento](Reference_Handbook.md)

### Struttura del repository

`packages/voice-engine-dsp/` — core DSP + motore prosodico per lo streaming, test e benchmark.

## Esecuzione delle suite di test

```bash
npm test
```

Oppure, eseguire suite specifiche:

```bash
npm run test:meaning
npm run test:determinism
npm run bench:rtf
npm run smoke
```

## Supporto

- **Domande / aiuto:** [Discussioni](https://github.com/mcp-tool-shop-org/mcp-voice-engine/discussions)
- **Segnalazione di bug:** [Problemi](https://github.com/mcp-tool-shop-org/mcp-voice-engine/issues)

## Licenza

MIT
