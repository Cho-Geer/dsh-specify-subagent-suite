// RESIDENT PORT of scratch/planA-subdisp-host.js (dynamic -> permanent).
// Uses only real Cordis ctx APIs (ctx.on/provide/get/timeout + injected services);
// no harness.* needed. Logic verbatim; only the module envelope changed.
// Plan A —— 新插件 subdisp（shared dispatch service provider）HOST 半体
// 职责：把 subpro-1 的 preset 派发/transport 派发/effort 栈/audit 整体平移到这里，
//       经 ctx.provide('subagentDispatch', impl) 发布到 root realm（进程全局共享）。
// 依据：scratch/planA-spec.md（权威契约）+ scratch/planA-research-provide.md（provide 机制）
//       + scratch/subpro1-current-host.txt（行为基线，逐字保留链路）
// 硬性约束：effort 的 agent/request 与 subagent/start 钩子只能在此注册一次；
//           迁出后 subpro-1 侧必须删除（H4 验证点）。
//
// effort 栈契约变更（2026-08-22 蓝图 effort-clamp v1.0.4；2026-08-23 蓝图 fill-only-model-default v2.0.0）：
//   - effort 水位优先级（effort 维度）：UI 选择 > dsh-subctl 模板覆盖 > subdisp dispatch 绑定 > 省略
//   - UI 选择或模板已设置 reasoningEffort 时退让为 fill-only（fill-only 早返回，不覆盖既有值）
//   - fill 路径对最终（不是 dispatch 时刻的）模型校验绑定合法性
//   - 无效绑定静默清掉 + 放行，让 llm 门控默认 materialization 兜底（不杀运行中的任务）
//   - 缓存按 (provider, model) 缓存 supports Set；throw 永不写入缓存（避免抖动锁死）
//   - start-time validateEffort 仍抛错（fail-fast on user input），fill-time 不抛（don't kill running task）
//   - HMR stale-cache 窗口（已知风险）：adapter HMR 不触发插件实例 dispose；若 adapter 能力集变化，
//     缓存仍指向旧 Set，fill 路径可能写一个已被 adapter 撤回的 effort → prepareCall 重新 resolve
//     (llm:826-828) 仍会抛 UNSUPPORTED_REASONING_EFFORT。缓解候选 ctx.llm.adapterGeneration() 与
//     ctx.llm.on('adapter/changed', ...) 在本会话审计中验证不存在（harness 0 匹配），列为 v1.0.4 follow-up。
//   - "换回原模型时 dispatch effort 复活"：fill-only yield 路径不会删 binding；若 yield 后 UI 未选 effort
//     且换回支持原 dispatch effort 的模型，下次 fill 路径会重新写入——dispatch 在所有更高水位缺失时胜出。
//   - 2026-08-23 v2.0.0 新增：dispatch 时刻由 dsh-subctl subagentTemplateControl 服务解析模板
//     provider/model 并一次性填充到 agentOptions；冻结 subagentTemplateBinding 快照；本插件通过
//     subagentDispatch.hasActiveChildren(sessionId) 向 subctl 提供在途子代理查询。

import { createRequire } from 'node:module'

export const plugin = {
  inject: ['subagents', 'llm', 'agents', 'agentPresets', 'sessionQuery', 'timer'],
  apply(ctx) {
    // ---- effort 栈（全局唯一，迁自 subpro-1）----
    const efforts = new Map() // agentId -> effort
    const pendingEffort = [] // FIFO
    const lastPresetRunId = { value: null }
    const effortSupportedCache = new Map() // ${provider}/${model} -> Set<effortId>（空集 = 模型无 reasoning；throw 永不写入）

    // 命名函数形式（蓝图 effort-clamp v1.0.3+）让 test seam 可直接引用 requestHook，
    // 避免 v1.0.2 匿名箭头 + __testHooks 引用 requestHook 标识符时的 ReferenceError。
    const requestHook = async (payload, next) => {
      const config = await next()
      const effort = efforts.get(payload.agent.id)
      if (effort === undefined) return config
      // UI 选择（installModelSelection model-selection.ts:60-68）或 dsh-subctl 模板覆盖（行 393 fill-only）
      // 已设置 reasoningEffort → 让位（N3 effort 水位：UI > template > dispatch）
      if (config.reasoningEffort !== undefined) return config
      // fill 路径：用最终模型（不是 dispatch 时刻的）重校验绑定是否还合法
      const cacheKey = config.provider + '/' + config.model
      let supported = effortSupportedCache.get(cacheKey)
      if (supported === undefined) {
        try {
          const info = await ctx.llm.resolveModelInfo(config.provider, config.model)
          const efforts2 = info.reasoning && Array.isArray(info.reasoning.efforts)
            ? info.reasoning.efforts.map((e) => e.id)
            : []
          supported = new Set(efforts2)
        } catch {
          // 网络/未知模型抖动：放行，让 llm 的最终门决定；不缓存失败（避免一次抖动锁死整个模型）
          return config
        }
        effortSupportedCache.set(cacheKey, supported)
      }
      if (!supported.has(effort)) {
        efforts.delete(payload.agent.id)            // 无效绑定清掉，避免下一轮重复撞
        return config                               // config 维持 reasoningEffort=undefined，由 llm 默认 materialization 兜底（llm:798, 806）
      }
      return { ...config, reasoningEffort: effort }
    }
    ctx.on('agent/request', requestHook)
    ctx.on('subagent/start', (info) => {
      for (const pending of pendingEffort) {
        if (!pending.consumed) {
          pending.consumed = true
          efforts.set(info.id, pending.effort)
          return
        }
      }
    })

    // ---- 常量与纯 helpers（逐字迁自 subpro-1）----
    const stopReasonError = (result) => {
      switch (result.stopReason) {
        case 'completed': return undefined
        case 'aborted': return 'subagent run was cancelled'
        case 'error': return 'subagent run failed (stopReason=error, see diagnostic)'
        case 'max-tokens': return 'subagent run hit its token limit before finishing'
        case 'refusal': return 'subagent declined the task'
        default: return 'subagent run ended abnormally (' + String(result.stopReason) + ')'
      }
    }

    const outputValueText = (values) => values
      .filter((value) => typeof value === 'object' && value !== null && !Array.isArray(value)
        && value.type === 'text' && typeof value.text === 'string')
      .map((value) => value.text)
      .join('')

    const SUBAGENT_DELEGATION_CONTEXT
      = 'You are a delegated subagent: your permission scope was fixed when you were started and cannot be '
        + 'widened from inside this session — operations that require approval are rejected automatically. '
        + 'When the task needs access beyond that scope, do not retry the denied operation; state the '
        + 'limitation in your reply so the delegating agent can handle it.'

    // ---- descriptor 词表对齐修复（2026-08-28，corrupted-session-record 根治）----
    // 本体 @deepseek-ai/dsh-subagent 已将 subagent/descriptor 升至 version 3
    // （版本不符的载荷被折叠为"无身份"，持久化目录显示 "corrupted session
    // record"），此处不再硬编码版本号：经 createRequire(ctx.baseUrl) 从运行
    // 中的本体包解析 SUBAGENT_DESCRIPTOR_VERSION 与 snapshotSubagentDescriptor，
    // 写入侧按当前运行时 schema 构造并校验载荷。解析失败（包布局变更）回退
    // 本地常量 3 并 warn 一次——最坏情况等价于旧的硬编码行为。
    // 注意：套件自身依赖未声明 dsh-subagent 时走回退分支（仍为 v3，正确）。
    let hostDescriptorApi = null
    try {
      const requireAtHost = createRequire(ctx.baseUrl)
      hostDescriptorApi = requireAtHost('@deepseek-ai/dsh-subagent')
    } catch (error) {
      console.warn('[dsh-subdisp] @deepseek-ai/dsh-subagent unresolvable at ctx.baseUrl; '
        + 'falling back to local descriptor constant 3. '
        + String(error && error.message ? error.message : error))
    }
    const SUBAGENT_DESCRIPTOR_VERSION = hostDescriptorApi !== null
      && typeof hostDescriptorApi.SUBAGENT_DESCRIPTOR_VERSION === 'number'
      ? hostDescriptorApi.SUBAGENT_DESCRIPTOR_VERSION
      : 3
    const snapshotSubagentDescriptor = hostDescriptorApi !== null
      && typeof hostDescriptorApi.snapshotSubagentDescriptor === 'function'
      ? hostDescriptorApi.snapshotSubagentDescriptor
      : null

    const toStopReason = (reason) => {
      switch (reason && reason.kind) {
        case 'completed': return 'completed'
        case 'max-tokens': return 'max-tokens'
        case 'aborted': return 'aborted'
        case 'blocked': return 'refusal'
        case 'error':
        case 'interrupted':
        default: return 'error'
      }
    }

    const safeStringify = (value) => {
      try { return JSON.stringify(value) } catch (e) { return '[unserializable]' }
    }

    const collectResult = (child, cancelledFlag) => {
      const events = child.session.events
      let text = ''
      let lastReason
      let lastAssistant = undefined
      for (const e of events) {
        if (e.type === 'turn/end') lastReason = e.data && e.data.reason
        if (e.type === 'assistant/message') {
          const data = e.data
          if (data && data.message && Array.isArray(data.message.content)) {
            for (const b of data.message.content) {
              if (b.type === 'text' && typeof b.text === 'string') text = b.text
            }
            lastAssistant = data
          }
        }
      }
      const recorded = toStopReason(lastReason)
      const stopReason = cancelledFlag && recorded !== 'completed' ? 'aborted' : recorded
      const output = text ? [{ type: 'text', text }] : []
      if (stopReason !== 'completed') {
        const lines = []
        lines.push('[diagnostic] stopReason=' + stopReason)
        lines.push('[diagnostic] turn/end.reason=' + safeStringify(lastReason))
        if (lastAssistant !== undefined) lines.push('[diagnostic] assistant.message=' + safeStringify(lastAssistant).slice(0, 1200))
        output.push({ type: 'text', text: lines.join('\n') })
      }
      return { output, stopReason }
    }

    const uuid = () => {
      const hex = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('')
      return hex(8) + '-' + hex(4) + '-4' + hex(3) + '-8' + hex(3) + '-' + hex(12)
    }
    const newChildId = () => 'c-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)

    const delegationDepthOf = (agent) => (agent.options.subagentDepth !== undefined ? agent.options.subagentDepth : 0)

    const resolveChildDepth = (parent, maxDepth) => {
      const childDepth = delegationDepthOf(parent) + 1
      if (typeof maxDepth === 'number' && childDepth > maxDepth) {
        throw new Error('subagent depth ' + String(childDepth) + ' exceeds maxDepth ' + String(maxDepth))
      }
      return childDepth
    }

    const resolveChildAgentOptions = (parent, requested, childDepth) => {
      const out = {}
      const pp = parent.options.provider
      const pm = parent.options.model
      const pt = parent.options.maxTokens
      if (pp !== undefined) out.provider = pp
      if (pm !== undefined) out.model = pm
      if (pt !== undefined) out.maxTokens = pt
      if (requested !== undefined) {
        if (requested.provider !== undefined) out.provider = requested.provider
        if (requested.model !== undefined) out.model = requested.model
        if (requested.maxTokens !== undefined) out.maxTokens = requested.maxTokens
      }
      // Preserve provenance separately from the resolved provider/model. The
      // parent model is inherited into child options above, but must not be
      // mistaken for an explicit model choice made for this dispatch.
      out.subagentExplicitModel = requested !== undefined
        && (requested.provider !== undefined || requested.model !== undefined)
      out.subagentDepth = childDepth
      return out
    }

    const buildChildMeta = (parent, preset, childDepth) => {
      const parentHeader = parent.session.header
      return {
        ...parentHeader.cwd !== undefined ? { cwd: parentHeader.cwd } : {},
        parentSession: parentHeader.id,
        origin: 'subagent',
        delegationDepth: childDepth,
        agentPreset: preset,
      }
    }

    // ---- 活跃子代理计数（蓝图 fill-only-model-default v2.0.0 N5）----
    const activeDescendants = new Map() // sessionId -> 该会话为根的活跃后代数量（含直接+间接）
    const sessionParent = new Map() // childSessionId -> parentSessionId

    const incActiveDescendants = (parentSession) => {
      let id = parentSession
      while (id !== undefined && id !== '') {
        activeDescendants.set(id, (activeDescendants.get(id) || 0) + 1)
        id = sessionParent.get(id)
      }
    }

    const decActiveDescendants = (childSessionId) => {
      const parent = sessionParent.get(childSessionId)
      let id = parent
      while (id !== undefined && id !== '') {
        const n = (activeDescendants.get(id) || 0) - 1
        if (n <= 0) activeDescendants.delete(id)
        else activeDescendants.set(id, n)
        id = sessionParent.get(id)
      }
    }

    const clearActiveSession = (sessionId) => {
      sessionParent.delete(sessionId)
      activeDescendants.delete(sessionId)
    }

    // v2.0.0 修复（复审 MAJOR-1）：父会话先于孙代理 settle 时，先把在途直接子代
    // 「过继」给祖父（父指针改指），再归还自身份额并清链节点——否则孙代理后续
    // dec 在断链处提前停止，根会话计数永久泄漏（面板永久锁死）。
    // 调用方须保证只 settle 一次（各路径已有 settled 守卫）。
    const settleChildSession = (childSessionId) => {
      if ((activeDescendants.get(childSessionId) || 0) > 0) {
        const grandparent = sessionParent.get(childSessionId)
        for (const [cid, pid] of sessionParent) {
          if (pid === childSessionId) sessionParent.set(cid, grandparent)
        }
      }
      decActiveDescendants(childSessionId)
      clearActiveSession(childSessionId)
    }

    const hasActiveChildren = (sessionId) => (activeDescendants.get(sessionId) || 0) > 0

    // ---- v2.0.3 推模式：把后代增减推送给 dsh-subctl（唯一验证可用的跨插件通道）----
    // 通道依据：subctl 的 provide 对本插件经 agent ctx 可见（dispatchFill→resolveBinding
    // 线上验证）；反向（subctl 拉取本插件服务 / 监听 agent/created）均线上验证不可达。
    let pushCtxRef = null // 最近一次成功解析到 subctl 服务的 ctx（落后兜底）
    const pushDescendant = (agentCtx, event, childSessionId, parentSession) => {
      const candidates = agentCtx !== undefined && agentCtx !== null ? [agentCtx, pushCtxRef] : [pushCtxRef]
      for (const c of candidates) {
        if (c === null || c === undefined) continue
        try {
          const ctl = c.get('subagentTemplateControl')
          if (ctl !== undefined && typeof ctl.reportDescendant === 'function') {
            ctl.reportDescendant({ event, childSessionId, parentSession })
            pushCtxRef = c
            return
          }
        } catch { /* best-effort：换下一个候选 ctx */ }
      }
    }

    // v2.0.0: 包装 transport one-shot run，使其 settle/dispose 时清理活跃计数
    // v2.0.3: 同步推送到 subctl（agentCtx = 派遣方 agent ctx，闭包捕获）
    const wrapRun = (run, parentSessionId, agentCtx) => {
      if (run === undefined || run.id === undefined) return run
      sessionParent.set(run.id, parentSessionId)
      incActiveDescendants(parentSessionId)
      pushDescendant(agentCtx, 'created', run.id, parentSessionId)
      let settled = false
      const settle = () => {
        if (settled) return
        settled = true
        settleChildSession(run.id)
        pushDescendant(agentCtx, 'settled', run.id, parentSessionId)
      }
      const origResult = run.result
      const origDispose = run.dispose
      return {
        ...run,
        result: origResult.finally(settle),
        dispose: () => {
          settle()
          return origDispose ? origDispose() : undefined
        },
      }
    }

    // ---- dispatch 时刻模板填充（蓝图 fill-only-model-default v2.0.0 §2.1）----
    let templateCtlAbsenceLogged = false
    function dispatchFill(parent, preset, requested, agentOptions) {
      const templateCtl = parent.ctx.get('subagentTemplateControl')
      if (templateCtl === undefined) {
        // RA2：服务缺席（dsh-subctl 未加载/后启动）→ 回退恒继承；首次派遣在 host 日志提示一次
        if (!templateCtlAbsenceLogged) {
          templateCtlAbsenceLogged = true
          console.warn('[dsh-subdisp] subagentTemplateControl service absent (dsh-subctl not loaded?); preset dispatches inherit the parent session model')
        }
        return
      }
      const callerGaveModel = requested !== undefined
        && (requested.provider !== undefined || requested.model !== undefined)
      if (callerGaveModel) return
      const ownerId = parent.session.header.id
      // v2.0.4 忙世代快照：优先走 root 归约解析（X 忙期新派遣读 root=X 的忙初 global
      // 快照，subctl 端 rootOf 沿推模式链上溯，孙/递归嵌套自动归约）；旧 subctl（无
      // resolveBindingForRoot）回落 live 直读（等价 v2.0.3，版本错配韧性 / W22 兜底）
      const resolveFn = typeof templateCtl.resolveBindingForRoot === 'function'
        ? templateCtl.resolveBindingForRoot
        : templateCtl.resolveBinding
      const b = resolveFn(ownerId, preset)
      if (b === undefined) return
      if (b.model !== undefined) {
        if (b.provider !== undefined) agentOptions.provider = b.provider
        agentOptions.model = b.model
        agentOptions.subagentExplicitModel = true
        agentOptions.subagentModelSource = 'template'
      }
      agentOptions.subagentTemplateBinding = Object.freeze({ provider: b.provider, model: b.model, effort: b.effort })
    }

    const capturePolicy = (parent) => ({
      sandboxMode: parent.ctx.get('sandboxPolicy')?.overrideOf(parent.session),
      approvalPolicy: parent.ctx.get('approval') === undefined ? undefined : 'never',
    })

    const appendPolicy = (child, overrides) => {
      if (overrides.sandboxMode !== undefined) {
        child.session.append('sandbox/mode', { mode: overrides.sandboxMode, source: 'delegation' })
      }
      if (overrides.approvalPolicy !== undefined) {
        child.session.append('approval/policy', { policy: overrides.approvalPolicy, source: 'delegation' })
      }
    }

    const attachDescriptorAppend = (childCtx, label) => {
      let appended = false
      childCtx.on('agent/pre-step', async ({ agent }, next) => {
        const decision = await next()
        if (!appended && decision.kind === 'enter') {
          appended = true
          const descriptor = snapshotSubagentDescriptor !== null
            ? snapshotSubagentDescriptor({ mode: 'one-shot', provider: 'preset-spawn', label })
            : { version: SUBAGENT_DESCRIPTOR_VERSION, mode: 'one-shot', provider: 'preset-spawn', label }
          agent.session.append('subagent/descriptor', descriptor)
        }
        return decision
      })
    }

    // L1+L3（preset ID 误用根治）：agents.create 之前先在工具边界解析 preset。
    // 本体 resolve() 未命中自抛 UnknownPresetError（含 available 清单）；
    // 命中但 broken 则给出 roster 的原因（同本体 resolveMountable 语义）。
    // 未命中 id 时对 roster 显示名（PresetMetadata.name）做去空白精确匹配，
    // 唯一命中才采用并注明映射；不做模糊/包含匹配，歧义即拒绝。
    async function resolvePresetId(requested) {
      let resolved
      try {
        resolved = await ctx.agentPresets.resolve(requested)
      } catch (err) {
        const rows = await ctx.agentPresets.list()
        const key = String(requested).trim()
        const matches = rows.filter((row) => row.name !== undefined && String(row.name).trim() === key)
        if (matches.length === 1) {
          // 别名命中同样做 broken 预检：broken preset 经显示名进入时，
          // 拒绝在工具边界而不是 setup 回调内抛错（与直接 id 路径同语义）。
          if (matches[0].broken !== undefined) {
            throw new Error('agent-presets: preset "' + String(matches[0].id) + '" (display name "' + key + '") is broken and cannot be mounted: ' + String(matches[0].broken))
          }
          return { id: String(matches[0].id), aliasOf: requested }
        }
        const ids = rows.map((row) => String(row.id)).join(', ') || 'none'
        const names = rows.map((row) => row.name !== undefined ? String(row.id) + ' (' + String(row.name) + ')' : String(row.id)).join('; ') || 'none'
        throw new Error(String(err && err.message ? err.message : err)
          + ' — preset must be a literal preset id (kebab-case directory name), not its display name. '
          + 'ids: ' + ids + '. id (display name): ' + names)
      }
      if (resolved.broken !== undefined) {
        throw new Error('agent-presets: preset "' + String(resolved.id) + '" is broken and cannot be mounted: ' + String(resolved.broken))
      }
      return { id: String(resolved.id), aliasOf: undefined }
    }

    // L5/R3（preset 选择治理）：派遣前核对父会话最近一条 user 消息是否点名了
    // 其他 preset（id 或显示名）。命中且与本次派遣不符 -> 输出非阻断注记，让
    // 模型当场自纠或如实上报。启发式必有误报，只做事实回显，不硬拦。
    async function intentNoteFor(parent, usedId) {
      try {
        const header = parent.session && parent.session.header
        const preset = header && header.agentPreset
        if (typeof preset !== 'string' || preset === '') return undefined
        // 从最近一条 user/message 提取点名候选（真实事件文本在 data.content[].text）
        let lastUserText = ''
        const events = parent.session.events
        if (Array.isArray(events)) {
          for (let i = events.length - 1; i >= 0; i--) {
            const e = events[i]
            if (e === null || typeof e !== 'object' || e.type !== 'user/message') continue
            const data = e.data !== null && typeof e.data === 'object' ? e.data : undefined
            const content = data !== undefined && Array.isArray(data.content) ? data.content : []
            const text = content
              .filter((b) => b !== null && typeof b === 'object' && b.type === 'text' && typeof b.text === 'string')
              .map((b) => b.text)
              .join('')
            if (text !== '') {
              lastUserText = text
              break
            }
          }
        }
        if (lastUserText === '') return undefined
        // 当前派遣使用的 id 若已在用户消息中出现，则视为点名命中，不注记
        if (lastUserText.includes(usedId)) return undefined
        // 用户消息中出现的中文显示名（preset.yml name）与本次派遣 id 不符
        const rows = await ctx.agentPresets.list()
        const mentioned = []
        for (const row of rows) {
          if (row.name === undefined) continue
          const nm = String(row.name)
          if (lastUserText.includes(nm)) mentioned.push(row.id + '(' + nm + ')')
        }
        if (mentioned.length === 0) return undefined
        return 'the triggering user message names preset ' + mentioned.join('、') + '; this dispatch used "' + usedId + '"'
      } catch {
        return undefined
      }
    }

    async function runWithPreset(args, exec, parent) {
      const resolution = await resolvePresetId(String(args.preset))
      const preset = resolution.id
      // R3（preset 选择治理）：派遣前核对用户消息点名，产出非阻断注记。
      const intentNote = await intentNoteFor(parent, preset)
      const maxDepth = typeof args.max_depth === 'number' ? args.max_depth : undefined
      const childDepth = resolveChildDepth(parent, maxDepth)
      const childId = newChildId()
      const inherited = capturePolicy(parent)

      const setup = (childCtx) => {
        const child = childCtx.agent
        const ap = childCtx.get('agentPresets')
        if (ap !== undefined) ap.mount(childCtx, preset)
        childCtx.systemPrompt.context({ name: 'subagent:delegation', order: 120, text: SUBAGENT_DELEGATION_CONTEXT })
        if (typeof args.persona === 'string' && args.persona.length > 0) {
          childCtx.systemPrompt.section({ name: 'deployment:persona', order: 0, text: args.persona })
        }
        if (args.tool_filter !== undefined) {
          childCtx.tools.restrict(args.tool_filter)
        }
        if (child !== undefined) appendPolicy(child, inherited)
        if (typeof args.description === 'string' && args.description.length > 0) {
          attachDescriptorAppend(childCtx, args.description)
        }
      }

      const meta = buildChildMeta(parent, preset, childDepth)
      const requestedOptions = {}
      if (args.provider !== undefined) requestedOptions.provider = String(args.provider)
      if (args.model !== undefined) requestedOptions.model = String(args.model)
      if (args.max_tokens !== undefined) requestedOptions.maxTokens = args.max_tokens
      const agentOptions = resolveChildAgentOptions(parent, requestedOptions, childDepth)
      dispatchFill(parent, preset, requestedOptions, agentOptions)

      const handle = await parent.ctx.agents.create({
        sessionId: childId,
        meta,
        agentOptions,
        signal: exec.signal,
        setup,
      })
      const child = handle.agent
      // v2.0.0 N5: 从创建即计入活跃后代，直到 result 或 dispose 终态
      const parentSessionId = parent.session.header.id
      sessionParent.set(childId, parentSessionId)
      incActiveDescendants(parentSessionId)
      pushDescendant(parent.ctx, 'created', childId, parentSessionId)

      const trackChildSettlement = () => {
        settleChildSession(childId)
        pushDescendant(parent.ctx, 'settled', childId, parentSessionId)
      }
      let settled = false
      const settleOnce = () => {
        if (settled) return
        settled = true
        trackChildSettlement()
      }

      const cancelled = { flag: false }
      const onAbort = () => { cancelled.flag = true; child.cancel({ kind: 'parent' }) }
      exec.signal.addEventListener('abort', onAbort, { once: true })
      if (exec.signal.aborted) onAbort()

      const childResult = (async () => {
        try {
          if (!cancelled.flag) {
            const message = {
              id: uuid(),
              role: 'user',
              content: [{ type: 'text', text: args.prompt }],
              source: { kind: 'user' },
            }
            child.followup(message)
            await child.whenIdle()
          }
          return collectResult(child, cancelled.flag)
        } finally {
          exec.signal.removeEventListener('abort', onAbort)
        }
      })()
      const result = (async () => {
        try {
          return await childResult
        } finally {
          settleOnce()
        }
      })()

      return {
        id: childId,
        preset,
        aliasOf: resolution.aliasOf,
        intentNote,
        localAgent: child,
        result,
        async dispose() {
          exec.signal.removeEventListener('abort', onAbort)
          cancelled.flag = true
          const settlements = await Promise.allSettled([handle.dispose(), result])
          settleOnce()
          if (settlements[0].status === 'rejected') throw settlements[0].reason
        },
      }
    }

    // ---- effort 校验（E2/E3）----
    const validateEffort = async (args, parent, signal) => {
      if (args.effort === undefined) return undefined
      const llmProvider = args.provider ?? parent.options.provider
      const model = args.model ?? parent.options.model
      if (llmProvider !== undefined && model !== undefined) {
        const info = await ctx.llm.resolveModelInfo(llmProvider, model, signal)
        const available = (info.reasoning && Array.isArray(info.reasoning.efforts))
          ? info.reasoning.efforts.map((entry) => entry.id)
          : []
        if (available.length === 0) throw new Error('model "' + llmProvider + '/' + model + '" exposes no reasoning effort levels')
        if (!available.includes(args.effort)) throw new Error('model "' + llmProvider + '/' + model + '" does not support effort "' + args.effort + '" (available: ' + available.join(', ') + ')')
      }
      return args.effort
    }

    // ---- 服务实现 ----
    const impl = {
      // 高/低层两个入口共享的内部启动器：preset 路径恒 foreground 句柄；transport 返回三态。
      async start(args, exec) {
        const parent = exec.agent
        if (!parent) throw new Error('subagent_pro tool requires a calling agent (exec.agent was undefined)')

        let effort
        if (args.effort !== undefined) {
          effort = await validateEffort(args, parent, exec.signal)
        }
        const pending = effort !== undefined ? { effort, consumed: false } : undefined
        if (pending !== undefined) pendingEffort.push(pending)

        const bind = (id) => {
          if (pending !== undefined && !pending.consumed) {
            pending.consumed = true
            efforts.set(id, pending.effort)
          }
        }

        if (typeof args.preset === 'string' && args.preset.length > 0) {
          const run = await runWithPreset(args, exec, parent)
          lastPresetRunId.value = run.id
          bind(run.id)
          // L3：别名命中时 preset 字段回填解析后的真实 id，主模型可见映射结果。
          return { kind: 'run', id: run.id, preset: run.preset, ...run.aliasOf !== undefined ? { presetAlias: run.aliasOf } : {}, ...run.intentNote !== undefined ? { intentNote: run.intentNote } : {}, result: run.result, dispose: () => run.dispose(), localAgent: run.localAgent }
        }

        const transport = args.subagent_provider ?? ctx.subagents.list()[0]
        if (transport === undefined) throw new Error('no subagent transport provider is registered')
        const transportProvider = ctx.subagents.getProvider(transport)
        if (transportProvider === undefined) throw new Error('subagent provider "' + transport + '" not registered')

        const agentOptions = {}
        if (args.provider !== undefined) agentOptions.provider = args.provider
        if (args.model !== undefined) agentOptions.model = args.model
        if (args.max_tokens !== undefined) agentOptions.maxTokens = args.max_tokens
        agentOptions.subagentExplicitModel = args.provider !== undefined || args.model !== undefined

        const request = {
          label: args.description,
          prompt: [{ type: 'text', text: args.prompt }],
          parent,
          ...Object.keys(agentOptions).length > 0 ? { agentOptions } : {},
        }

        const continuable = transportProvider.prepareContinuable !== undefined
        const background = args.run_in_background === true || (args.run_in_background === undefined && continuable)

        if (background) {
          if (continuable) {
            const started = await ctx.subagents.startContinuable({ provider: transport, label: args.description, request, signal: exec.signal })
            bind(started.childId)
            return { kind: 'continuable', subagentId: started.childId }
          }
          const jobs = ctx.get('jobs')
          if (jobs === undefined) throw new Error('background jobs unavailable: load the jobs service or set run_in_background: false')
          let boundId
          const id = jobs.start({
            kind: 'subagent',
            label: args.description,
            owner: parent,
            run: () => {
              const controller = new AbortController()
              const startPromise = ctx.subagents.start(transport, { ...request, signal: controller.signal })
                .then((run) => {
                  boundId = run.id
                  bind(boundId)
                  const parentSessionId = parent.session.header.id
                  sessionParent.set(boundId, parentSessionId)
                  incActiveDescendants(parentSessionId)
                  pushDescendant(parent.ctx, 'created', boundId, parentSessionId)
                  return run
                })
              return {
                cancel: (reason) => controller.abort(reason ?? 'background subagent task killed'),
                done: (async () => {
                  try {
                    const run = await startPromise
                    const result = await run.result
                    const error = stopReasonError(result)
                    if (error === undefined) return { status: 'completed' }
                    return { status: 'failed', detail: error }
                  } catch (error) {
                    return controller.signal.aborted ? { status: 'killed' } : { status: 'failed', detail: String(error) }
                  } finally {
                    if (boundId !== undefined) {
                      efforts.delete(boundId)
                      settleChildSession(boundId)
                      pushDescendant(parent.ctx, 'settled', boundId, parent.session.header.id)
                    }
                  }
                })(),
              }
            },
          })
          return { kind: 'background', jobId: id }
        }

        const run = await ctx.subagents.start(transport, { ...request, signal: exec.signal })
        bind(run.id)
        const parentSessionId = parent.session.header.id
        const tracked = wrapRun(run, parentSessionId, parent.ctx)
        return { kind: 'run', id: run.id, result: tracked.result, dispose: () => tracked.dispose(), rawRun: run }
      },

      // 高层业务入口 = subagent_pro 工具输出契约（行为逐字保留 subpro-1 现状）
      async dispatch(args, exec) {
        const parent = exec.agent
        if (!parent) throw new Error('subagent_pro tool requires a calling agent (exec.agent was undefined)')

        if (args.effort !== undefined) {
          await validateEffort(args, parent, exec.signal)
        }
        const pending = args.effort !== undefined ? { effort: String(args.effort), consumed: false } : undefined
        if (pending !== undefined) pendingEffort.push(pending)
        const releasePending = () => {
          if (pending !== undefined && !pending.consumed) {
            const index = pendingEffort.indexOf(pending)
            if (index >= 0) pendingEffort.splice(index, 1)
          }
        }

        try {
          if (typeof args.preset === 'string' && args.preset.length > 0) {
            // preset 路径：恒 foreground；保留 A25 怪癖（错误时不 dispose、不 delete effort）
            const run = await runWithPreset(args, exec, parent)
            lastPresetRunId.value = run.id
            if (pending !== undefined && !pending.consumed) {
              pending.consumed = true
              efforts.set(run.id, pending.effort)
            }
            const result = await run.result
            const error = stopReasonError(result)
            if (error !== undefined) {
              const diagnosticText = result.output.filter((b) => b.type === 'text' && typeof b.text === 'string').map((b) => b.text).join('\n')
              throw new Error(error + '\n' + (diagnosticText || ''))
            }
            await Promise.resolve().then(() => run.dispose())
            efforts.delete(run.id)
            return { kind: 'foreground', runId: run.id, preset: run.preset, ...run.aliasOf !== undefined ? { presetAlias: run.aliasOf } : {}, ...run.intentNote !== undefined ? { intentNote: run.intentNote } : {}, output: result.output }
          }

          // transport 路径
          const transport = args.subagent_provider ?? ctx.subagents.list()[0]
          if (transport === undefined) throw new Error('no subagent transport provider is registered')
          const transportProvider = ctx.subagents.getProvider(transport)
          if (transportProvider === undefined) throw new Error('subagent provider "' + transport + '" not registered')

          const agentOptions = {}
          if (args.provider !== undefined) agentOptions.provider = args.provider
          if (args.model !== undefined) agentOptions.model = args.model
          if (args.max_tokens !== undefined) agentOptions.maxTokens = args.max_tokens
          agentOptions.subagentExplicitModel = args.provider !== undefined || args.model !== undefined

          const request = {
            label: args.description,
            prompt: [{ type: 'text', text: args.prompt }],
            parent,
            ...Object.keys(agentOptions).length > 0 ? { agentOptions } : {},
          }

          const continuable = transportProvider.prepareContinuable !== undefined
          const background = args.run_in_background === true || (args.run_in_background === undefined && continuable)

          if (background) {
            if (continuable) {
              const started = await ctx.subagents.startContinuable({ provider: transport, label: args.description, request, signal: exec.signal })
              if (pending !== undefined && !pending.consumed) {
                pending.consumed = true
                efforts.set(started.childId, pending.effort)
              }
              return { kind: 'continuable', subagentId: started.childId }
            }
            const jobs = ctx.get('jobs')
            if (jobs === undefined) throw new Error('background jobs unavailable: load the jobs service or set run_in_background: false')
            let boundId
            const id = jobs.start({
              kind: 'subagent',
              label: args.description,
              owner: parent,
              run: () => {
                const controller = new AbortController()
                const startPromise = ctx.subagents.start(transport, { ...request, signal: controller.signal })
                  .then((run) => {
                    boundId = run.id
                    if (pending !== undefined && !pending.consumed) {
                      pending.consumed = true
                      efforts.set(boundId, pending.effort)
                    }
                    const parentSessionId = parent.session.header.id
                    sessionParent.set(boundId, parentSessionId)
                    incActiveDescendants(parentSessionId)
                    pushDescendant(parent.ctx, 'created', boundId, parentSessionId)
                    return run
                  })
                return {
                  cancel: (reason) => controller.abort(reason ?? 'background subagent task killed'),
                  done: (async () => {
                    try {
                      const run = await startPromise
                      const result = await run.result
                      const error = stopReasonError(result)
                      if (error === undefined) return { status: 'completed' }
                      return { status: 'failed', detail: error }
                    } catch (error) {
                      return controller.signal.aborted ? { status: 'killed' } : { status: 'failed', detail: String(error) }
                    } finally {
                      if (boundId !== undefined) {
                        efforts.delete(boundId)
                        settleChildSession(boundId)
                        pushDescendant(parent.ctx, 'settled', boundId, parent.session.header.id)
                      }
                    }
                  })(),
                }
              },
            })
            releasePending()
            return { kind: 'background', jobId: id }
          }

          const run = await ctx.subagents.start(transport, { ...request, signal: exec.signal })
          if (pending !== undefined && !pending.consumed) {
            pending.consumed = true
            efforts.set(run.id, pending.effort)
          }
          const dispatchParentSessionId = parent.session.header.id
          sessionParent.set(run.id, dispatchParentSessionId)
          incActiveDescendants(dispatchParentSessionId)
          pushDescendant(parent.ctx, 'created', run.id, dispatchParentSessionId)
          const [execution] = await Promise.allSettled([run.result.then((result) => {
            const error = stopReasonError(result)
            if (error !== undefined) throw new Error(error)
            return { kind: 'foreground', runId: run.id, output: result.output }
          })])
          const [disposal] = await Promise.allSettled([Promise.resolve().then(() => run.dispose())])
          efforts.delete(run.id)
          settleChildSession(run.id)
          pushDescendant(parent.ctx, 'settled', run.id, dispatchParentSessionId)
          if (execution.status === 'rejected') {
            if (disposal.status === 'rejected') throw new AggregateError([execution.reason, disposal.reason], 'subagent run failed; dispose also failed')
            throw execution.reason
          }
          if (disposal.status === 'rejected') throw disposal.reason
          return execution.value
        } finally {
          releasePending()
        }
      },

      async auditSession(sessionId, opts) {
        const sessionQuery = ctx.get('sessionQuery')
        if (sessionQuery === undefined) throw new Error('session query service is not mounted; cannot audit sessions')
        let id = String(sessionId)
        if (id === 'last') {
          if (lastPresetRunId.value === null) throw new Error('no preset-dispatched child recorded yet in this session')
          id = lastPresetRunId.value
        }
        const readHeaders = async () => {
          const snap = await sessionQuery.readSession(id)
          const headers = snap.events
            .filter((event) => event.type === 'request/header')
            .map((event) => {
              const config = event.data.header.config
              const out = {
                reason: event.data.reason,
                provider: config.provider,
                model: config.model,
              }
              if (config.reasoningEffort !== undefined) out.reasoningEffort = config.reasoningEffort
              if (config.maxTokens !== undefined) out.maxTokens = config.maxTokens
              return out
            })
          return { snap, headers }
        }
        let { snap, headers } = await readHeaders()
        if (opts?.waitForRequests !== false && headers.length === 0) {
          for (let attempt = 0; attempt < 3 && headers.length === 0; attempt++) {
            await ctx.timeout(3000)
            const next = await readHeaders()
            snap = next.snap
            headers = next.headers
          }
        }
        const result = {
          sessionId: id,
          requestCount: headers.length,
          requestHeaders: headers,
        }
        if (snap.session.agentPreset !== undefined) result.agentPreset = snap.session.agentPreset
        if (snap.session.origin !== undefined) result.origin = snap.session.origin
        if (snap.session.parentSession !== undefined) result.parentSession = snap.session.parentSession
        return result
      },

      get lastPresetRunId() {
        return lastPresetRunId.value
      },

      // v2.0.0 N5: 查询某会话是否存在活跃后代（直接 + 间接）
      hasActiveChildren: (sessionId) => hasActiveChildren(sessionId),

      // 列出当前存在活跃后代的会话 id。诊断/兼容保留：subctl v2.0.3 起改经
      // reportDescendant 推模式自治计数，不再消费本方法（2026-08-22 复审 NOTE-1 修正表述）。
      activeSessions: () => Array.from(activeDescendants.keys()),
    }

    // root realm 发布（进程全局、跨会话共享；stop/update 自动注销，无需包裹 effect / 持有 disposer）
    ctx.provide('subagentDispatch', impl)

    // K4a 修复（2026-08-23）：apply 返回 impl，让合并入口 lib/index.js 无需
    // monkey-patch ctx.provide 即可拿到 impl。monkey-patch 会经 reflect mixin
    // accessor 污染进程级唯一的 ReflectService（ctx.provide 被永久替换为
    // 套件 ctx 绑定版本），导致后续所有插件的 provide 全部落到套件 fiber
    // 的全局 realm —— preset 子树服务双注册、所有 preset 挂载失败。
    // 返回值路径与 plugin.apply 既有契约兼容（框架忽略 apply 返回值）。
    return impl

    // effort 栈清理随服务 fiber 回收
    ctx.on('dispose', () => {
      efforts.clear()
      pendingEffort.length = 0
      effortSupportedCache.clear() // 蓝图 effort-clamp v1.0.1+：dispose 时同步清掉 (provider, model) supports 缓存
    })

    // Test-only seam（蓝图 effort-clamp v1.0.2+ §2.8 / fill-only-model-default v2.0.0 §2.8）：闭包闭入 module-scope __testHooks。
    // 这是测试专用 API，**不是公开契约**；生产代码不应引用。Module-level 引用见文件尾 __getTestHooks。
    __testHooks = {
      setBinding: (agentId, effort) => { efforts.set(agentId, effort) },
      clearBinding: (agentId) => { efforts.delete(agentId) },
      getBinding: (agentId) => efforts.get(agentId),
      hasBinding: (agentId) => efforts.has(agentId),
      requestHook,                       // agent/request 钩子主体（fill-only + 重校验）
      cacheSize: () => effortSupportedCache.size,
      cacheKeys: () => Array.from(effortSupportedCache.keys()),
      clearCache: () => effortSupportedCache.clear(),
      // v2.0.0 §2.8: 派遣填充函数 + 活跃计数探针
      dispatchFill,
      activeDescendants,
      sessionParent,
      hasActiveChildren,
      incActiveDescendants,
      decActiveDescendants,
      settleChildSession,
    }
  },
}


export const inject = plugin.inject
export function apply(ctx) {
  return plugin.apply(ctx)
}

// ---- Test-only seam（蓝图 effort-clamp v1.0.2+ §2.8）----
// 插件 apply(ctx) 内部将钩子 + cache + efforts 的访问桥到 module-scope __testHooks。
// 仅供 test-runtime.mjs 与未来调试工具使用；不要在生产代码引用。
let __testHooks = null
export function __getTestHooks() {
  return __testHooks
}
