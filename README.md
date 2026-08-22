# dsh-specify-subagent-suite

**Languages**: [English](./README.md) | [简体中文](./README.zh.md) | [日本語](./README.ja.md)

Five resident DeepSeek Harness (DSH) plugins merged into **one Cordis bundle**: the right-side Agent list, the subagent template panel, the one-shot subagent record badge, and the `subagent_pro` / `subagent_pro_presets` / `subagent_pro_audit` tools.

If you use DSH and dispatch subagents — especially with Agent Presets — this suite gives you a unified control surface: browse presets in the sidebar, bind provider/model/effort templates per preset (globally or per session), dispatch nested subagents through one tool, and audit exactly which model each child actually ran on.

## Features

1. **Right-side Agent list** — a `details` sidebar listing every dispatchable Agent Preset with health (broken presets explain why they cannot mount), with incremental auto-expansion of catalogs.
2. **Subagent template panel** — a `子Agent 模板` dropdown in the session header to configure `provider / model / effort` overrides per preset. Two layers: **global** (all sessions) and **session** (this session only). Edits persist in the host at `~/.dsh/subctl/overrides.json`. While a session is busy (main turn running or any descendant in flight) edits are rejected for that session, and global edits made by *other* sessions during a busy generation do not leak into that session's dispatches until it goes idle.
3. **One-shot subagent record badge** — a composer badge showing readable chips (provider / model / preset / effort) for the most recent subagent record, in both light and dark themes.
4. **`subagent_pro`** — dispatch subagents with a `preset`, `provider`, `model`, `effort`, `max_tokens`, or `run_in_background` parameter — everything the built-in `subagent` tool cannot do. Supports nested delegation (root → child → grandchild) with depth limits.
5. **`subagent_pro_presets` / `subagent_pro_audit`** — list every dispatchable preset with literal ids (call before dispatching when unsure), and inspect a dispatched child's actual request headers (provider / model / reasoningEffort / preset).

## Install

```bash
dsh plugin --profile web add Cho-Geer/dsh-specify-subagent-suite
```

or with npm:

```bash
cd ~/.dsh/profiles/web && pnpm add @zach-tao/dsh-specify-subagent-suite
```

then add the row to your profile's `cordis.patch.yml` (id `specify-subagent-suite`) and restart `dsh web`.

> Do not keep this suite installed alongside the five original plugins it replaces (`dsh-subdisp`, `dsh-subpro`, `dsh-subctl`, `dsh-agent-sidebar`, `dsh-composer-model-badge`) — double registration of routes, hooks, tools and slots is undefined behavior. Uninstall the originals when you switch.

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
