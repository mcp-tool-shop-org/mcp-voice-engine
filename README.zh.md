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

# MCP 语音引擎

> [MCP Tool Shop](https://mcptoolshop.com) 的一部分

一个确定性的、以流式传输为先的韵律引擎，用于富有表现力的语音合成、音高控制和实时语音转换。

## 为什么需要它

大多数语音数字信号处理 (DSP) 系统在两个方面存在问题：**稳定性**（颤音、抖动、音符颤抖）和**可重复性**（“这种情况有时才会发生”）。 MCP 语音引擎的设计目标是具有音乐性、因果性和确定性，因此它的行为更像软件，而不是一种难以捉摸的现象。

## 你可以用它来构建什么

*   **实时语音风格化**，用于游戏和交互式应用程序（稳定的目标，富有表现力的控制）
*   **流式语音流水线**（服务器、机器人、实时处理）
*   **DAW/工具链集成**（确定性的音高目标，一致的渲染行为）
*   **Web Audio 演示**（采用 AudioWorklet 架构）

## 快速入门

```bash
npm i
npm run build
npm test
```

## 核心功能

### 确定性输出
相同的输入 + 配置（以及分块策略）会产生相同的输出，并通过基于哈希的测试提供回归保护。

### 以流式传输为先的运行时
具有状态的、因果处理，专为低延迟而设计。 不支持事后编辑。 支持快照/恢复，用于持久性和可恢复性。

### 富有表现力的韵律控制
事件驱动的重音和边界音，让您可以有意识地塑造节奏和语调，而不会破坏音高目标。

### 语义测试（语义约束）
测试套件强制执行通信行为，包括：
*   **重音局部性**（无“扩散”）
*   **疑问句与陈述句的边界**（上升 vs 下降）
*   **重点后的压缩**（重点具有影响）
*   **确定性的事件顺序**
*   **风格单调性**（富有表现力 > 中性 > 平淡，且不增加不稳定性）

## 文档

主要文档位于 [packages/voice-engine-dsp/docs/](packages/voice-engine-dsp/docs/) 目录下。

### 主要文档

*   [流式架构](packages/voice-engine-dsp/docs/STREAMING_ARCHITECTURE.md)
*   [语义契约](packages/voice-engine-dsp/docs/MEANING_CONTRACT.md)
*   [调试指南](packages/voice-engine-dsp/docs/DEBUGGING.md)
*   [参考手册](Reference_Handbook.md)

### 仓库结构

`packages/voice-engine-dsp/` — 核心数字信号处理 (DSP) + 流式韵律引擎、测试和基准测试

## 运行测试套件

```bash
npm test
```

或者运行特定的套件：

```bash
npm run test:meaning
npm run test:determinism
npm run bench:rtf
npm run smoke
```

## 支持

- **问题/帮助：** [讨论](https://github.com/mcp-tool-shop-org/mcp-voice-engine/discussions)
- **错误报告：** [问题](https://github.com/mcp-tool-shop-org/mcp-voice-engine/issues)

## 许可证

MIT
