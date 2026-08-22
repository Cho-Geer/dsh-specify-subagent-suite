# dsh-specify-subagent-suite（サブエージェントテンプレートスイート）

5 つの常駐 DeepSeek Harness（DSH）プラグインを**1 つの Cordis バンドル**に統合：右サイドの Agent リスト、サブエージェントテンプレートパネル、単発サブエージェント record バッジ、および `subagent_pro` / `subagent_pro_presets` / `subagent_pro_audit` の 3 ツール。

DSH でサブエージェントを頻繁に派遣する——特に Agent Preset と併用する——ユーザーに向けた統制画面を提供します：サイドバーで preset を閲覧し、preset ごとに provider / model / effort テンプレートを（グローバルまたはセッション単位で）バインドし、1 つのツールでネストされた派遣を行い、各子エージェントが実際にどのモデルで実行されたかを監査できます。

## 機能

1. **右サイド Agent リスト** —— すべての派遣可能な Agent Preset を `details` サイドバーに一覧表示（broken の preset はマウント不能な理由を提示）。カタログはインクリメンタルに自動展開。
2. **サブエージェントテンプレートパネル** —— セッションヘッダーの「子Agent 模板」ドロップダウンで、preset ごとに `provider / model / effort` オーバーライドを設定。**グローバル層**（全セッション）と**セッション層**（当該セッションのみ）の 2 層構造。編集は host が `~/.dsh/subctl/overrides.json` に永続化。セッション繁忙中（メイン turn 実行中または子孫 in-flight 中）はそのセッションの編集を拒否し、繁忙世代の間に他セッションが行ったグローバル編集は、当該セッションが空闲になるまで派遣面に漏れません。
3. **単発サブエージェント record バッジ** —— composer バッジが直近のサブエージェント record を読みやすい chips（provider / model / preset / effort）で表示。ライト／ダーク両テーマ対応。
4. **`subagent_pro`** —— `preset`、`provider`、`model`、`effort`、`max_tokens`、`run_in_background` パラメータでサブエージェントを派遣——内蔵 `subagent` ツールにはできないすべて。ネスト派遣（ルート → 子 → 孫）と深度制限に対応。
5. **`subagent_pro_presets` / `subagent_pro_audit`** —— 派遣可能な全 preset のリテラル id を一覧表示（不確実な場合は派遣前に呼び出し）；子エージェントの実際のリクエストヘッダー（provider / model / reasoningEffort / preset）を参照。

## インストール

```bash
dsh plugin --profile web add Cho-Geer/dsh-specify-subagent-suite
```

または npm 経由：

```bash
cd ~/.dsh/profiles/web && pnpm add @zach-tao/dsh-specify-subagent-suite
```

その後、profile の `cordis.patch.yml` に行を追加し（id は `specify-subagent-suite`）、`dsh web` を再起動してください。

> 本スイートが置き換える 5 つのオリジナルプラグイン（`dsh-subdisp`、`dsh-subpro`、`dsh-subctl`、`dsh-agent-sidebar`、`dsh-composer-model-badge`）との**併用はしないでください**——ルート・フック・ツール・slot の二重登録は未定義動作です。切り替え時にオリジナルをアンインストールしてください。

## 実行時要件

- **Node.js** `^22.19.0 || >=24.0.0`（DSH host に準拠）。
- **`@deepseek-ai/dsh-tools`** —— 本パッケージの `dependencies`（`next` dist-tag）により公共 npm から自動解決。host 側ツール（`subagent_pro` 等）はこれを通じて定義され、手動作業は不要。
- **React** `^18.2.0` —— peer dependency。DSH web client が実行時に提供（バンドルされない）。

## 既知の制限

- フレームワーク内蔵の `subagent_fork` / `subagent` ツールはテンプレート・繁忙追踪の対象外（内蔵ツールはプラグインの派遣パスを経由しない）。
- 繁忙世代のテンプレート凍結は `subagent_pro` 経由の preset 派遣をカバー。純 transport 派遣（preset なし）は設計上テンプレートを参照しない。
- テンプレートの `provider/model` は**派遣時点**で一度だけ注入。子の実行中に UI でモデルを切替えた場合、以降のリクエストでは UI 選択が意図的に優先される。

## ライセンス

MIT © 2026 Cho-Geer —— [LICENSE](./LICENSE) を参照。
