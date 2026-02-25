<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="assets/logo.png" alt="MCP Voice Engine" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-voice-engine/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/mcp-tool-shop-org/mcp-voice-engine/ci.yml?branch=main&style=flat-square&label=CI" alt="CI"></a>
  <img src="https://img.shields.io/badge/node-%E2%89%A520-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js 20+">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/mcp-voice-engine?style=flat-square" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-voice-engine/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
</p>

# MCP Voice Engine

> Fait partie de [MCP Tool Shop](https://mcptoolshop.com)

Moteur de prosodie déterministe, axé sur le streaming, pour la synthèse vocale expressive, le contrôle de la hauteur et la transformation vocale en temps réel.

## Pourquoi ce produit existe

La plupart des systèmes de traitement du signal vocal (DSP) présentent des lacunes en deux points : **la stabilité** (vibrations, tremblements, fluctuations de la hauteur) et **la reproductibilité** ("cela ne se produit que parfois"). MCP Voice Engine est conçu pour être musical, causal et déterministe, ce qui signifie qu'il se comporte comme un logiciel, et non comme une légende.

## Ce que vous pouvez créer avec

*   **Stylisation vocale en temps réel** pour les jeux et les applications interactives (cibles stables, contrôles expressifs)
*   **Pipelines vocaux en streaming** (serveurs, bots, traitement en direct)
*   **Intégration aux stations de travail audio (DAW) / chaînes d'outils** (cibles de hauteur déterministes, comportement de rendu cohérent)
*   **Démonstrations Audio Web** (architecture compatible AudioWorklet)

## Démarrage rapide

```bash
npm i
npm run build
npm test
```

## Fonctionnalités principales

### Sortie déterministe
Les mêmes entrées + configuration (et politique de découpage) produisent la même sortie, avec une protection contre les régressions grâce à des tests basés sur des hachages.

### Exécution axée sur le streaming
Traitement à état, causal, conçu pour une faible latence. Pas de modifications rétroactives. Prise en charge des instantanés/restauration pour la persistance et la reprise.

### Contrôles de prosodie expressifs
Les accents et les tons de frontière déclenchés par des événements vous permettent de façonner le rythme et l'intonation de manière intentionnelle, sans déstabiliser les cibles de hauteur.

### Tests de signification (contraintes sémantiques)
La suite de tests garantit un comportement communicatif, notamment :
*   **Localité des accents** (pas de "flou")
*   **Distinction entre questions et affirmations** (montée vs descente)
*   **Compression post-accentuation** (l'accentuation a des conséquences)
*   **Ordre des événements déterministe**
*   **Monotonie du style** (expressif > neutre > plat sans augmenter l'instabilité)

## Documentation

La documentation principale se trouve dans [packages/voice-engine-dsp/docs/](packages/voice-engine-dsp/docs/).

### Documents clés

*   [Architecture du streaming](packages/voice-engine-dsp/docs/STREAMING_ARCHITECTURE.md)
*   [Contrat de signification](packages/voice-engine-dsp/docs/MEANING_CONTRACT.md)
*   [Guide de débogage](packages/voice-engine-dsp/docs/DEBUGGING.md)
*   [Manuel de référence](Reference_Handbook.md)

### Structure du dépôt

`packages/voice-engine-dsp/` — cœur du DSP + moteur de prosodie en streaming, tests et benchmarks

## Exécution des suites de tests

```bash
npm test
```

Ou exécutez des suites spécifiques :

```bash
npm run test:meaning
npm run test:determinism
npm run bench:rtf
npm run smoke
```

## Support

- **Questions / aide :** [Discussions](https://github.com/mcp-tool-shop-org/mcp-voice-engine/discussions)
- **Signalement de bogues :** [Issues](https://github.com/mcp-tool-shop-org/mcp-voice-engine/issues)

## Licence

MIT
