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

> Parte da [MCP Tool Shop](https://mcptoolshop.com)

Motor de prosódia determinístico, com foco em streaming, para síntese de voz expressiva, controle de afinação e transformação de voz em tempo real.

## Por que isso existe

A maioria dos sistemas de processamento de áudio (DSP) falha em dois aspectos: **estabilidade** (tremidos, oscilações, vibrações) e **reprodutibilidade** ("isso acontece apenas às vezes"). O MCP Voice Engine foi projetado para ser musical, causal e determinístico, comportando-se como um software, e não como uma lenda.

## O que você pode criar com ele

*   **Estilização de voz em tempo real** para jogos e aplicativos interativos (alvos estáveis, controles expressivos)
*   **Pipelines de voz em streaming** (servidores, bots, processamento em tempo real)
*   **Integração com DAWs / ferramentas** (alvos de afinação determinísticos, comportamento de renderização consistente)
*   **Demonstrações de Web Audio** (arquitetura compatível com AudioWorklet)

## Início rápido

```bash
npm i
npm run build
npm test
```

## Funcionalidades principais

### Saída determinística
A mesma entrada + configuração (e política de divisão) produz a mesma saída, com proteção contra regressões por meio de testes baseados em hash.

### Runtime focado em streaming
Processamento causal e com estado, projetado para baixa latência. Sem edições retroativas. Suporte para snapshot/restauração para persistência e retomada.

### Controles de prosódia expressivos
Acentos e tons de contorno orientados a eventos permitem moldar o ritmo e a entonação de forma intencional, sem desestabilizar os alvos de afinação.

### Testes de significado (regras semânticas)
O conjunto de testes garante um comportamento comunicativo, incluindo:
*   **localidade de ênfase** (sem "espalhamento")
*   **limites entre perguntas e afirmações** (elevação vs. queda)
*   **compressão pós-foco** (o foco tem consequências)
*   **ordem determinística de eventos**
*   **monotonicidade de estilo** (expressivo > neutro > plano, sem aumentar a instabilidade)

## Documentação

A documentação principal está localizada em [packages/voice-engine-dsp/docs/](packages/voice-engine-dsp/docs/).

### Documentos importantes

*   [Arquitetura de Streaming](packages/voice-engine-dsp/docs/STREAMING_ARCHITECTURE.md)
*   [Contrato de Significado](packages/voice-engine-dsp/docs/MEANING_CONTRACT.md)
*   [Guia de Depuração](packages/voice-engine-dsp/docs/DEBUGGING.md)
*   [Manual de Referência](Reference_Handbook.md)

### Estrutura do repositório

`packages/voice-engine-dsp/` — núcleo do DSP + motor de prosódia em streaming, testes e benchmarks.

## Executando os conjuntos de testes

```bash
npm test
```

Ou execute conjuntos específicos:

```bash
npm run test:meaning
npm run test:determinism
npm run bench:rtf
npm run smoke
```

## Suporte

- **Dúvidas / ajuda:** [Discussões](https://github.com/mcp-tool-shop-org/mcp-voice-engine/discussions)
- **Relatórios de bugs:** [Issues](https://github.com/mcp-tool-shop-org/mcp-voice-engine/issues)

## Licença

MIT
