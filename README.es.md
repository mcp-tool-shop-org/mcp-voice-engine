<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-voice-engine/readme.png" alt="MCP Voice Engine" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-voice-engine/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/mcp-tool-shop-org/mcp-voice-engine/ci.yml?branch=main&style=flat-square&label=CI" alt="CI"></a>
  <img src="https://img.shields.io/badge/node-%E2%89%A520-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js 20+">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/mcp-voice-engine?style=flat-square" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-voice-engine/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
</p>

# MCP Voice Engine

> Parte de [MCP Tool Shop](https://mcptoolshop.com)

Motor de prosodia determinista, diseñado para la transmisión de datos, para la síntesis de voz expresiva, el control de la entonación y la transformación de voz en tiempo real.

## ¿Por qué existe esto?

La mayoría de los sistemas de procesamiento de voz (DSP) fallan en dos aspectos: **estabilidad** (sonidos distorsionados, vibraciones, temblor) y **reproducibilidad** ("solo ocurre a veces"). MCP Voice Engine está diseñado para ser musical, causal y determinista, lo que significa que se comporta como un software, no como una leyenda.

## ¿Qué puedes crear con él?

*   **Estilización de voz en tiempo real** para juegos y aplicaciones interactivas (objetivos estables, controles expresivos).
*   **Canales de voz en streaming** (servidores, bots, procesamiento en vivo).
*   **Integración con DAW / cadenas de herramientas** (objetivos de entonación deterministas, comportamiento de renderizado consistente).
*   **Demostraciones de Web Audio** (arquitectura compatible con AudioWorklet).

## Guía de inicio rápido

```bash
npm i
npm run build
npm test
```

## Funcionalidades principales

### Salida determinista
La misma entrada + configuración (y política de segmentación) produce la misma salida, con protección contra regresiones mediante pruebas basadas en hash.

### Entorno de ejecución optimizado para streaming
Procesamiento con estado y causal diseñado para baja latencia. No se permiten ediciones retrospectivas. Soporte para instantáneas y restauración para persistencia y capacidad de reanudación.

### Controles de prosodia expresivos
Los acentos y tonos de borde basados en eventos le permiten dar forma al ritmo y la entonación de manera intencional, sin desestabilizar los objetivos de entonación.

### Pruebas de significado (controles semánticos)
El conjunto de pruebas garantiza un comportamiento comunicativo, que incluye:
*   **Localidad de los acentos** (sin "difuminado").
*   **Límites entre preguntas y afirmaciones** (ascenso vs. descenso).
*   **Compresión post-énfasis** (el énfasis tiene consecuencias).
*   **Ordenamiento determinista de los eventos**.
*   **Monotonía del estilo** (expresivo > neutro > plano sin aumentar la inestabilidad).

## Documentación

La documentación principal se encuentra en [packages/voice-engine-dsp/docs/](packages/voice-engine-dsp/docs/).

### Documentos clave

*   [Arquitectura de streaming](packages/voice-engine-dsp/docs/STREAMING_ARCHITECTURE.md)
*   [Contrato de significado](packages/voice-engine-dsp/docs/MEANING_CONTRACT.md)
*   [Guía de depuración](packages/voice-engine-dsp/docs/DEBUGGING.md)
*   [Manual de referencia](Reference_Handbook.md)

### Estructura del repositorio

`packages/voice-engine-dsp/` — núcleo de procesamiento de señales (DSP) + motor de prosodia para streaming, pruebas y puntos de referencia.

## Ejecución de los conjuntos de pruebas

```bash
npm test
```

O ejecute conjuntos específicos:

```bash
npm run test:meaning
npm run test:determinism
npm run bench:rtf
npm run smoke
```

## Soporte

*   **Preguntas / ayuda:** [Discusiones](https://github.com/mcp-tool-shop-org/mcp-voice-engine/discussions)
*   **Informes de errores:** [Problemas](https://github.com/mcp-tool-shop-org/mcp-voice-engine/issues)

## Licencia

MIT
