# dsh-specify-subagent-suite

**Languages**: [简体中文](./README.md) | [English](./README.en.md) | [日本語](./README.ja.md)

Five resident DeepSeek Harness (DSH) plugins merged into **one Cordis bundle**: the right-side Agent list, the subagent template panel, the one-shot subagent record badge, and the `subagent_pro` / `subagent_pro_presets` / `subagent_pro_audit` tools.

If you use DSH and dispatch subagents — especially with Agent Presets — this suite gives you a unified control surface: browse presets in the sidebar, bind provider/model/effort templates per preset (globally or per session), dispatch nested subagents through one tool, and audit exactly which model each child actually ran on.

## Features

### 1. Right-side Agent list

A `details` sidebar listing every dispatchable Agent Preset with health (broken presets explain why they cannot mount), with incremental auto-expansion of catalogs.

![Right-side Agent list](./docs/assets/01-agent-list.png)

Three tabs along the top: `Agent 列表` / `To-Do` / `工具详情`. An empty session reads "主会话暂无子代理。" (no subagents yet). Once a subagent is dispatched, the sidebar reveals the metadata of the most recent record — preset, provider, model, effort.

### 2. Subagent template panel

A `子Agent 模板` dropdown in the session header to configure `provider / model / effort` overrides per preset.

- **Two layers**: **global** (all sessions) and **session** (this session only).
- **Persistence**: edits are persisted in the host at `~/.dsh/subctl/overrides.json`.
- **Busy protection**: while a session is busy (main turn running or any descendant in flight) edits are rejected for that session, and global edits made by *other* sessions during a busy generation do not leak into that session's dispatches until it goes idle.

![Subagent template panel](./docs/assets/02-subctl-panel.png)

Two tabs at the top of the panel: `全部默认` (global layer) | `仅本会话` (session layer). Each row is a preset: a `provider / model` dropdown on the left, an `effort` dropdown on the right. The `刷新` button in the upper right re-reads disk overrides.

### 3. One-shot subagent record badge

A composer badge showing readable chips (`provider / model / preset / effort`) for the most recent subagent record, in both light and dark themes.

![One-shot subagent record badge](./docs/assets/03-composer-badge.png)

The badge sits above the composer input. Its caption reads "一次性子代理记录 —— 一次性任务不支持持续消息，可在这里看完整执行记录。" Chips look like `standard` / `volcano-engineering/ark-code-latest`, mapping to the record's preset and the provider/model it was actually dispatched to.

### 4. `subagent_pro`

Dispatch subagents with a `preset`, `provider`, `model`, `effort`, `max_tokens`, or `run_in_background` parameter — everything the built-in `subagent` tool cannot do. Supports nested delegation (root → child → grandchild) with depth limits.

![subagent_pro dispatch flow](./docs/assets/04-subagent-pro.png)

The screenshot shows the rule-driven dispatch flow: call `subagent_pro_presets` first to confirm the target preset exists, verify the `subagent_pro` signature, then dispatch with `preset / provider / model / effort`. This is the canonical `subagent_pro` surface.

### 5. `subagent_pro_presets` / `subagent_pro_audit`

- **`subagent_pro_presets`** — list every dispatchable preset with literal ids (call before dispatching when unsure).

![subagent_pro_presets output](./docs/assets/05-subagent-pro-presets.png)

Tool signature: `subagent_pro_presets({})`. Output looks like `{"presets":[{"id":"standard","name":"标准模式","description":"...","trust":"system"}, ...]}`. Each entry gives the dispatchable kebab-case id.

- **`subagent_pro_audit`** — inspect a dispatched child's actual request headers (`provider / model / reasoningEffort / preset`).

![subagent_pro_audit output](./docs/assets/06-subagent-pro-audit.png)

Tool signature: `subagent_pro_audit({ sessionId: "last" })`. Output: `requestHeaders[0] = { reason, provider, model }`, plus `agentPreset`, `origin`, `parentSession`. Turns "I assumed it ran on X" into "it actually ran on X".

## Install

```bash
dsh plugin --profile web add Cho-Geer/dsh-specify-subagent-suite
```

or with npm:

```bash
cd ~/.dsh/profiles/web && pnpm add @zach-tao/dsh-specify-subagent-suite
```

then add the row to your profile's `cordis.patch.yml` (id `specify-subagent-suite`) and restart `dsh web`.

## Runtime requirements

- **Node.js** `^22.19.0 || >=24.0.0` (matches the DSH host).
- **`@deepseek-ai/dsh-tools`** — resolved automatically from public npm via this package's `dependencies` (`next` dist-tag). The host-half tools (`subagent_pro` etc.) are defined through it; no manual step is needed.
- **React** `^18.2.0` — peer dependency; provided by the DSH web client at runtime (never bundled).

## Known limitations

- The `subagent_fork` / built-in `subagent` tools are **not** covered by the template or busy-tracking system (framework built-ins bypass plugin dispatch paths).
- Busy-generation template freezing covers preset dispatches through `subagent_pro`; transport-only dispatches (no preset) never consult templates by design.
- Template `provider/model` is filled **once at dispatch time**; a mid-run UI model switch intentionally wins for subsequent requests of that child.

## License

MIT © 2026 Cho-Geer — see [LICENSE](./LICENSE).