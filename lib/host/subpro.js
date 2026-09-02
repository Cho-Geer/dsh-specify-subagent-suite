// RESIDENT PORT of scratch/planA-subpro1-thinshell-host.js (dynamic -> permanent).
// Tool definitions kept verbatim; the two harness.* verbs are mapped to the real
// resident API:
//   harness.defineTool(def)   -> defineTool(def) from '@deepseek-ai/dsh-tools'
//   harness.registerTool(ctx, t) -> ctx.tools.register(t)
// defineTool is resolved through the SAME anchor the Cordis loader itself uses
// (createRequire(ctx.baseUrl) -> profile node_modules), so no vendored import
// chain is needed and the module stays self-contained (upgrade-immune).
// We use require.resolve() only for resolution, then await import() to actually
// load the ESM-only @deepseek-ai/dsh-tools package, avoiding Node.js
// ERR_INTERNAL_ASSERTION race conditions from require()-ing an ES Module while
// it is being dynamically imported in parallel.
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

export const inject = ['tools', 'systemPrompt', 'agentPresets']

/**
 * Pure listener for `system-prompt/assemble`: move `subagent_pro` to
 * position 0 of `assembly.tools` if present and not already first. Always
 * calls `next()`. Exported so the plugin's own unit tests can import this
 * without booting a full DSH composition; the runtime contract (called
 * by `apply()`) is unchanged.
 *
 * Behavior matrix (verified by `tests/promote-listener.test.mjs`):
 *   - native mode, subagent_pro at any non-first index -> moved to 0
 *   - native mode, subagent_pro at index 0            -> no-op
 *   - code mode, [run_code] only                      -> no-op
 *   - code mode, [run_code, subagent_pro] (defensive) -> subagent_pro to 0
 *   - empty tools                                      -> no-op
 */
export function promoteSubagentPro(assembly, _context, next) {
  const index = assembly.tools.findIndex((t) => t && t.name === 'subagent_pro')
  if (index > 0) {
    const [entry] = assembly.tools.splice(index, 1)
    assembly.tools.unshift(entry)
  }
  return next()
}

export async function apply(ctx, dispatch) {
  const requireAtBase = createRequire(ctx.baseUrl)
  const toolsPath = requireAtBase.resolve('@deepseek-ai/dsh-tools')
  // require.resolve() returns a raw filesystem path; ESM import() only
  // accepts file:/data:/node: specifiers. On Windows a raw Win32 path is
  // parsed as URL scheme `c:` -> ERR_UNSUPPORTED_ESM_URL_SCHEME (POSIX
  // absolute paths happen to work, which is why this only broke on
  // Windows). Convert with pathToFileURL, which also handles separators
  // and percent-encoding of spaces/#/non-ASCII.
  const { defineTool } = await import(pathToFileURL(toolsPath).href)

  // MERGE NOTE (Phase 0.5.1(A), re-applied at v8/v9 re-sync): `subagentDispatch`
  // is NOT in `inject` — the merged host entry `lib/index.js` captures the
  // impl from subdisp's `ctx.provide` call and passes it as the second
  // argument. `ctx.subagentDispatch` would deadlock (same fiber) or leak
  // (cross-fiber), so it is replaced by the parameter + null guard.
  if (dispatch === undefined || dispatch === null) {
    throw new Error('dsh-specify-subagent-suite: subpro requires dispatch impl from subdisp; got undefined')
  }

  const outputValueText = (values) => values
    .filter((value) => typeof value === 'object' && value !== null && !Array.isArray(value)
      && value.type === 'text' && typeof value.text === 'string')
    .map((value) => value.text)
    .join('')

  // Promote `subagent_pro` to the head of the model-facing tool list.
  //
  // We do NOT set a static `system-prompt.toolOrder` in cordis.patch.yml:
  //   (a) the override would replace the row's whole `config`, requiring
  //       us to restate the persona written by whichever bundle sits
  //       between base and this plugin (e.g. dsh-web-app sets a non-
  //       empty persona), and any wrong restatement silently wipes the
  //       deployment persona;
  //   (b) a static `toolOrder` naming `subagent_pro` breaks every
  //       `presentAs('code')` session: in code mode the tools
  //       registry's `wireSchemas` collapses `knownNames` to
  //       `[RUN_CODE_NAME]`, so `orderTools` would throw
  //       `toolOrder lists unregistered tool "subagent_pro"` on every
  //       prompt assembly.
  // Instead, mutate the assembly at runtime: this waterfall listener
  // runs after `orderTools` has already canonicalized the list. When
  // `subagent_pro` is present in the assembly (native mode, or any
  // mode that includes it), move it to position 0; when it isn't
  // (code mode, or any restrict that filters it out), the find()
  // returns undefined and we do nothing — no error path.
  // See packages/core/system-prompt/src/index.ts:520-534 for the
  // order-tools-then-waterfall contract, and tools/src/index.ts:994-
  // 998 for the code-mode `knownNames` collapse.
  ctx.on('system-prompt/assemble', promoteSubagentPro)

  ctx.tools.register(defineTool({
    name: 'subagent_pro',
    description: 'PREFER this over the shipped `subagent` tool whenever the subtask needs anything the '
      + 'shipped `subagent` cannot do — a different provider/model, a non-default reasoning effort, '
      + 'or (especially) a specific Agent Preset. The shipped `subagent` tool only accepts `description`, '
      + '`prompt`, and `run_in_background`; it has no `preset`, `provider`, `model`, or `effort` parameters, '
      + 'so any subagent delegation that needs preset dispatch or model/reasoning overrides MUST go '
      + 'through this tool. '
      + 'Same standalone-child contract as `subagent`: the child runs in its own context, does not see '
      + 'this conversation, returns its result (not its intermediate steps). '
      + 'Omit `provider` / `model` to inherit the calling agent\'s current model; omit `effort` to keep '
      + 'the model default. '
      + 'Pass `preset` to dispatch the child under a specific Agent Preset (templates listed by the '
      + 'subagent-controller panel in the session header — e.g. "high-precision"); the child then '
      + 'mounts that preset\'s composition (tools + persona + prompt sections) instead of inheriting '
      + 'the parent\'s preset. Use `subagent_pro_audit` to inspect a preset-dispatched child\'s '
      + 'actual provider/model/effort as recorded in its request headers. '
      // R2（preset 选择治理）：用户点名 > 工作区默认 的优先级成文在决策时刻的第一证据源。
      + 'Priority rule: the preset explicitly named by the user (id or display name, e.g. "标准模式" = '
      + 'standard) ALWAYS wins over any workspace default (e.g. ~/.dsh/AGENTS.md defaults); workspace '
      + 'defaults apply only when the user named none.',
    parameters: {
      description: { type: 'string', required: true, description: 'A short (3-5 word) description of the delegated task.' },
      prompt: { type: 'string', required: true, description: 'The complete, self-contained task for the subagent.' },
      preset: { type: 'string', description: 'Literal Agent Preset id (kebab-case directory name, e.g. high-precision), NOT its display name. The preset explicitly named by the user (id or display name) always wins over any workspace default; workspace defaults apply only when the user named none. When unsure, call subagent_pro_presets first to list valid ids.' },
      provider: { type: 'string', description: 'LLM provider/adapter name.' },
      model: { type: 'string', description: 'Model id under that provider.' },
      effort: { type: 'string', description: 'Reasoning effort id (off / high / max for DeepSeek).' },
      max_tokens: { type: 'integer', description: 'Maximum output tokens per request.' },
      subagent_provider: { type: 'string', description: 'Subagent transport provider name (e.g. spawn).' },
      run_in_background: { type: 'boolean', description: 'Whether to run in the background.' },
    },
    output: {
      schema: {
        oneOf: [
          { type: 'object', additionalProperties: false, properties: { kind: { type: 'string', required: true, const: 'background' }, jobId: { type: 'string', required: true } } },
          { type: 'object', additionalProperties: false, properties: { kind: { type: 'string', required: true, const: 'continuable' }, subagentId: { type: 'string', required: true } } },
          // presetAlias：display 别名命中时由 subdisp 回填（真实 id 在 preset 字段）。
          // intentNote：R3 派遣后意图核对注记（用户消息点名与本次派遣不符时由 subdisp 回填）。
          { type: 'object', additionalProperties: false, properties: { kind: { type: 'string', required: true, const: 'foreground' }, runId: { type: 'string', required: true }, preset: { type: 'string' }, presetAlias: { type: 'string' }, intentNote: { type: 'string' }, output: { type: 'array', required: true, items: { type: 'json' } } } },
        ],
      },
      render: (_args, value) => [{
        type: 'text',
        text: value.kind === 'background'
          ? 'started background subagent task ' + value.jobId
          : value.kind === 'continuable'
            ? 'started subagent ' + value.subagentId
            // R3：intentNote 若存在则进入模型可见文本，促其当场自纠或如实上报。
            : '[preset=' + String(value.preset || '?') + '] runId=' + value.runId
              + (typeof value.intentNote === 'string' && value.intentNote !== '' ? '\n[intent-note] ' + value.intentNote : '')
              + '\n' + outputValueText(value.output),
      }],
    },
    isConcurrencySafe: () => true,
    async execute(args, exec) {
      return dispatch.dispatch(args, exec)
    },
  }))

  // L2（preset ID 误用根治）：只读枚举工具。每次调用实时消费本体
  // agentPresets.list()（discovery 不缓存，运行期新增 preset 即时可见），
  // 让"先列候选 ID 再派遣"成为一次工具调用而不是文件系统探查。
  ctx.tools.register(defineTool({
    name: 'subagent_pro_presets',
    description: 'List every dispatchable Agent Preset with its literal id (the value subagent_pro\'s '
      + '`preset` parameter expects), display name, trust level, and health. Call this BEFORE dispatching '
      + 'when the preset id is uncertain. Broken presets report why they cannot mount.',
    parameters: {},
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    },
    isConcurrencySafe: () => true,
    async execute() {
      const rows = await ctx.agentPresets.list()
      return {
        presets: rows.map((row) => ({
          id: String(row.id),
          ...row.name !== undefined ? { name: String(row.name) } : {},
          ...row.description !== undefined ? { description: String(row.description) } : {},
          trust: String(row.trust),
          ...row.broken !== undefined ? { broken: String(row.broken) } : {},
        })),
      }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'subagent_pro_audit',
    description: 'Read the persisted request/header events of a subagent session and report the exact provider, model, and '
      + 'reasoningEffort each of its requests was dispatched with, plus the session\'s agentPreset (the template mounted '
      + 'for the child). Pass sessionId="last" for the most recent preset dispatch.',
    parameters: {
      sessionId: { type: 'string', required: true, description: 'Subagent session id (or "last").' },
      wait_for_requests: { type: 'boolean', description: 'Poll up to ~9s for a request/header when none exists (default true).' },
    },
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    },
    isConcurrencySafe: () => true,
    async execute(args, exec) {
      return dispatch.auditSession(String(args.sessionId), { waitForRequests: args.wait_for_requests })
    },
  }))
}
