# dsh-specify-subagent-suite（子代理模板工具套件）

**语言**： [简体中文](./README.md) | [English](./README.en.md) | [日本語](./README.ja.md)

五个常驻 DeepSeek Harness（DSH）插件合并为**一个 Cordis bundle**：右侧栏 Agent 列表、子代理模板面板、一次性子代理 record 徽章，以及 `subagent_pro` / `subagent_pro_presets` / `subagent_pro_audit` 三个工具。

如果你在使用 DSH 且经常派遣子代理——尤其是配合 Agent Preset 使用——本套件提供统一的控制面：在侧栏浏览 preset、为每个 preset 绑定 provider/model/effort 模板（全局或会话级）、用一个工具完成嵌套派遣，并审计每个子代理实际运行在哪个模型上。

## 功能

1. **右侧 Agent 列表** —— `details` 侧栏列出全部可派遣的 Agent Preset 及健康状态（broken 的 preset 会给出无法挂载的原因），目录增量自动展开。
2. **子代理模板面板** —— 会话头部的「子Agent 模板」下拉面板，按 preset 配置 `provider / model / effort` 覆盖。双层作用域：**全局层**（所有会话）与**会话层**（仅本会话）。编辑由 host 持久化到 `~/.dsh/subctl/overrides.json`。会话忙时（主 turn 在途或任一后代在途）该会话的编辑被拒绝；忙世代期间其他会话对全局层的编辑也不会渗入该会话的派遣面，直到其转闲后生效。
3. **一次性子代理 record 徽章** —— composer 徽章以可读 chips（provider / model / preset / effort）展示最近一条子代理 record，亮暗两主题适配。
4. **`subagent_pro`** —— 以 `preset`、`provider`、`model`、`effort`、`max_tokens`、`run_in_background` 参数派遣子代理——内置 `subagent` 工具做不到的一切。支持嵌套派遣（根 → 子 → 孙）与深度限制。
5. **`subagent_pro_presets` / `subagent_pro_audit`** —— 列出全部可派遣 preset 的字面 id（不确定时先调用再派遣）；读取子代理的实际请求头（provider / model / reasoningEffort / preset）。

## 安装

```bash
dsh plugin --profile web add Cho-Geer/dsh-specify-subagent-suite
```

或用 npm：

```bash
cd ~/.dsh/profiles/web && pnpm add @zach-tao/dsh-specify-subagent-suite
```

然后在 profile 的 `cordis.patch.yml` 加入该行（id 为 `specify-subagent-suite`）并重启 `dsh web`。

## 运行时要求

- **Node.js** `^22.19.0 || >=24.0.0`（与 DSH host 对齐）。
- **`@deepseek-ai/dsh-tools`** —— 经本包 `dependencies`（`next` dist-tag）自动从公共 npm 解析。host 半体的工具（`subagent_pro` 等）经它定义，无需手动处理。
- **React** `^18.2.0` —— peer dependency，由 DSH web client 在运行时提供（永不打包）。

## 已知限制

- 框架内置的 `subagent_fork` / `subagent` 工具**不在**模板与忙态追踪覆盖范围内（内置工具不经插件派遣路径）。
- 忙世代模板冻结覆盖经 `subagent_pro` 的 preset 派遣；纯 transport 派遣（无 preset）按设计不查模板。
- 模板 `provider/model` 仅在**派遣时刻**一次性填充；子代理运行期间 UI 切换模型对后续请求有意胜出。

## 许可

MIT © 2026 Cho-Geer —— 见 [LICENSE](./LICENSE)。
