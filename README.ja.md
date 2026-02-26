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

> [MCP Tool Shop](https://mcptoolshop.com) の一部

表現力豊かな音声合成、ピッチ制御、およびリアルタイム音声変換のための、決定論的でストリーミングを重視した音声処理エンジンです。

## この製品が存在する理由

多くの音声DSPシステムは、以下の2つの点で問題を抱えています。**安定性**（音の揺れ、ビブラート、音のちらつき）と**再現性**（「時々しか起こらない」）。MCP Voice Engineは、音楽的で、因果関係に基づき、決定論的に動作するように設計されており、ソフトウェアとして動作し、伝承のようなものではありません。

## これを使って構築できるもの

*   ゲームやインタラクティブなアプリケーション向けの**リアルタイム音声スタイル化**（安定した動作、表現力豊かな制御）
*   **ストリーミング音声パイプライン**（サーバー、ボット、リアルタイム処理）
*   **DAW/ツールチェーンとの統合**（決定論的なピッチ設定、一貫したレンダリング動作）
*   **Web Audioのデモ**（AudioWorkletに対応したアーキテクチャ）

## クイックスタート

```bash
npm i
npm run build
npm test
```

## 主要機能

### 決定論的な出力
同じ入力と設定（およびチャンキングポリシー）を使用すると、常に同じ出力が得られます。ハッシュベースのテストにより、リグレッションを防止します。

### ストリーミング優先の実行環境
低遅延を実現するために設計された、ステートフルで因果関係に基づいた処理を行います。過去の編集はできません。永続化と再開のために、スナップショット/復元機能がサポートされています。

### 表現力豊かな音声制御
イベント駆動型のアクセントと境界音を使用することで、意図的にリズムとイントネーションを調整できます。これにより、ピッチの安定性を損なうことなく表現力を高めることができます。

### 意味テスト（意味的な制約）
テストスイートは、以下のコミュニケーション機能を検証します。
*   **アクセントの局所性**（音のぼやけがない）
*   **疑問文と平叙文の区別**（上昇と下降）
*   **強調後の圧縮**（強調には影響がある）
*   **決定論的なイベント順序**
*   **スタイルの一貫性**（表現力 > 中立 > 平坦。ただし、不安定性を高めない）

## ドキュメント

主要なドキュメントは、[packages/voice-engine-dsp/docs/](packages/voice-engine-dsp/docs/) にあります。

### 主要なドキュメント

*   [ストリーミングアーキテクチャ](packages/voice-engine-dsp/docs/STREAMING_ARCHITECTURE.md)
*   [意味的な契約](packages/voice-engine-dsp/docs/MEANING_CONTRACT.md)
*   [デバッグガイド](packages/voice-engine-dsp/docs/DEBUGGING.md)
*   [リファレンスハンドブック](Reference_Handbook.md)

### リポジトリの構成

`packages/voice-engine-dsp/` — コアのDSP、ストリーミング音声処理エンジン、テスト、およびベンチマーク

## テストスイートの実行

```bash
npm test
```

または、特定のスイートを実行します。

```bash
npm run test:meaning
npm run test:determinism
npm run bench:rtf
npm run smoke
```

## サポート

- **質問 / ヘルプ:** [ディスカッション](https://github.com/mcp-tool-shop-org/mcp-voice-engine/discussions)
- **バグレポート:** [イシュー](https://github.com/mcp-tool-shop-org/mcp-voice-engine/issues)

## ライセンス

MIT
