// RESIDENT PORT of scratch/current-plugins/subctl2-host.js (dynamic -> permanent).
//
// Wire channel: direct webServer exact route POST /subagent-controller/rpc
// (the original pre-PTC design). The 2026-08-18 TypertRemoteService port
// cannot work in a live tsx + pnpm-junction process: this plugin loaded one
// copy of @deepseek-ai/dsh-typert-protocol through createRequire(ctx.baseUrl)
// (realpath URL) while the api-gateway holds its own tsx-resolved copy, and
// Remote markers live in a module-private WeakMap — so the gateway never saw
// our six wire markers and /api/subagentTemplateControl/* answered HTTP 404
// (verified live: gateway.invoke fails with 'invocation-unavailable' while
// the service, its typertRemote binding, and all six methods are present).
// A direct route has no module-identity dependency. The six wire method
// names and the business envelopes are unchanged.
// provider/model stamp 契约变更（2026-08-23 蓝图 fill-only-model-default v2.0.0）：
//   - 模板 provider/model 在 dsh-subdisp dispatch 时刻一次性填充（本插件经
//     subagentTemplateControl 服务提供 resolveBinding）；本 hook 不再触碰 provider/model
//   - 模板 effort 经 dispatch 时刻冻结的 subagentTemplateBinding 由本 hook fill-only 写入，
//     写入前对最终每请求 (provider, model) 做 supports-effort 校验；不支持静默丢弃（N4 保留）
//   - 在途 agent 对模板编辑免疫（只读冻结快照，不读 live overrides）
//   - 会话忙时（主 turn 在途或有子 agent 在途）apply-template-config 拒绝编辑（N5 无效化）
//   - 模板未指定 model → 子代理继承父会话 model（N1'-a，由 subdisp 不填充实现）
//   - 模板只指定 model → reasoningEffort 留空，由 llm 终门物化该模型默认强度（N1'-c，D5）
// 历史契约（v1.0.4，已被上段撤销）：provider/model 曾为「保留字段」不写入 LLM 请求；
// 2026-08-23 实测与 high-precision 复审（runId c-mt4a5rxn-xe796f7w）判定该决策违背用户需求后废除。

// subagentDispatch 注入已移除（v2.0.2）：bundle 双面插件的 ctx 对邻接 bundle 的 provide
// 不可见（ctx.get 与 inject 均实测失败）；HasActiveDescendants 改为本插件经 agent/created +
// agent/disposed 事件自治计数（见 F4/N5 注释块）。inject 恢复为基础三服务。
export const inject = ['llm', 'agentPresets', 'webServer']

// ---- Test-only seam（蓝图 fill-only-model-default v1.0.4 §三 F5）----
// 插件 apply(ctx) 内部将钩子 + cache + overrides 的访问桥到 module-scope __testHooks。
// 仅供 test-runtime.mjs 与未来调试工具使用；不要在生产代码引用。
// Mirror 蓝图 effort-clamp v1.0.4 §2.8 / dsh-subdisp lib/index.js 的 seam 模式。
let __testHooks = null
export function __getTestHooks() {
  return __testHooks
}

const RPC_PATH = '/subagent-controller/rpc'
const MAX_BODY_BYTES = 1048576

// B4: host is the sole authority of overrides. Persisted at ~/.dsh/subctl/overrides.json
// formatVersion 2: { formatVersion: 2, global: { [presetId]: cfg }, sessions: { [ownerId]: { [presetId]: cfg } } }.
// v1 (flat presetId -> cfg, no formatVersion key) is read into `global` for compatibility.
// (mirrors ~/.dsh/task-board/ledger-v2.json pattern; resolved via DSH_HOME env).
// DSH home resolution matches packages/util/home-paths/src/index.ts:98 — DSH_HOME env first, else ~/.dsh.
import os from 'node:os'
import path from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import { writeFile, rename, mkdir } from 'node:fs/promises'

let persistChain = Promise.resolve()

function dshHome() {
  const envHome = process.env.DSH_HOME
  if (typeof envHome === 'string' && envHome !== '') return envHome
  return path.join(os.homedir(), '.dsh')
}

function overridesPath() {
  return path.join(dshHome(), 'subctl', 'overrides.json')
}

function loadPersisted() {
  const file = overridesPath()
  if (!existsSync(file)) return { formatVersion: 2, global: {}, sessions: {} }
  try {
    const raw = readFileSync(file, 'utf8')
    const parsed = JSON.parse(raw)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return { formatVersion: 2, global: {}, sessions: {} }
    // v1: flat presetId -> cfg (no formatVersion). Read into global layer.
    if (parsed.formatVersion === undefined) {
      const global = {}
      for (const [id, o] of Object.entries(parsed)) {
        if (o !== null && typeof o === 'object') global[String(id)] = o
      }
      return { formatVersion: 2, global, sessions: {} }
    }
    if (parsed.formatVersion !== 2) {
      console.warn('dsh-subctl: overrides.json formatVersion ' + String(parsed.formatVersion) + ' unsupported; starting empty')
      return { formatVersion: 2, global: {}, sessions: {} }
    }
    const global = parsed.global !== null && typeof parsed.global === 'object' && !Array.isArray(parsed.global) ? parsed.global : {}
    const sessions = parsed.sessions !== null && typeof parsed.sessions === 'object' && !Array.isArray(parsed.sessions) ? parsed.sessions : {}
    return { formatVersion: 2, global, sessions }
  } catch (err) {
    console.warn('dsh-subctl: parse overrides.json failed; starting empty:', err && err.message ? err.message : err)
    return { formatVersion: 2, global: {}, sessions: {} }
  }
}

async function persistOverrides(globalOverrides, sessionOverrides) {
  const file = overridesPath()
  const dir = path.dirname(file)
  const tmp = file + '.tmp.' + process.pid + '.' + Math.random().toString(16).slice(2)
  const globalOut = {}
  for (const [id, o] of globalOverrides) {
    globalOut[String(id)] = pick(o)
  }
  const sessionsOut = {}
  for (const [ownerId, byPreset] of sessionOverrides) {
    const layer = {}
    for (const [id, o] of byPreset) layer[String(id)] = pick(o)
    if (Object.keys(layer).length > 0) sessionsOut[String(ownerId)] = layer
  }
  const payload = { formatVersion: 2, global: globalOut, sessions: sessionsOut }
  const operation = persistChain.catch(() => {}).then(async () => {
    await mkdir(dir, { recursive: true })
    await writeFile(tmp, JSON.stringify(payload, null, 2), 'utf8')
    await rename(tmp, file)
  })
  persistChain = operation
  return operation
}

// B3: session real preset = last 'agent-preset/selected' event, fallback to header.
function resolvePreset(session) {
  if (session !== undefined && session !== null && typeof session === 'object') {
    const events = session.events
    if (Array.isArray(events)) {
      for (let i = events.length - 1; i >= 0; i--) {
        const e = events[i]
        if (e !== null && typeof e === 'object' && e.type === 'agent-preset/selected') {
          const v = e.data !== null && typeof e.data === 'object' ? e.data.agentPreset : undefined
          if (typeof v === 'string') return v
        }
      }
    }
    const header = session.header
    if (header !== null && typeof header === 'object') {
      const v = header.agentPreset
      if (typeof v === 'string') return v
    }
  }
  return undefined
}

// B7: drop maxTokens; only declared surface (provider / model / effort).
function pick(o) {
  const out = {}
  if (o.provider !== undefined) out.provider = o.provider
  if (o.model !== undefined) out.model = o.model
  if (o.effort !== undefined) out.effort = o.effort
  return out
}

export function apply(ctx) {
  // 双层覆盖表：会话层（ownerId -> Map<presetId, cfg>）优先，全局层回落。
  // ownerId = 派发方会话 id（子代理 header.parentSession，孙代理指向直接父会话）。
  const globalOverrides = new Map()
  const sessionOverrides = new Map()
  let mutationChain = Promise.resolve()
  // B4: hydrate from disk at plugin load; host is now the only writer.
  // Synchronous read keeps the cordis apply(ctx) contract intact.
  const persisted = loadPersisted()
  for (const [id, o] of Object.entries(persisted.global)) {
    if (o !== null && typeof o === 'object') globalOverrides.set(id, o)
  }
  for (const [ownerId, byPreset] of Object.entries(persisted.sessions)) {
    if (byPreset === null || typeof byPreset !== 'object') continue
    const layer = new Map()
    for (const [id, o] of Object.entries(byPreset)) {
      if (o !== null && typeof o === 'object') layer.set(id, o)
    }
    if (layer.size > 0) sessionOverrides.set(ownerId, layer)
  }

  /** 解析一层覆盖：preset 存在则返回精简副本。 */
  const layerOf = (map, preset) => {
    const o = map.get(preset)
    return o === undefined ? undefined : pick(o)
  }

  /** 生效解析：会话层 > 全局层（显式 resolve 步骤，非隐式合并）。 */
  const resolveOverride = (ownerId, preset) => {
    if (ownerId !== undefined) {
      const byPreset = sessionOverrides.get(ownerId)
      if (byPreset !== undefined) {
        const o = layerOf(byPreset, preset)
        if (o !== undefined) return o
      }
    }
    return layerOf(globalOverrides, preset)
  }

  // ---- 蓝图 fill-only-model-default v2.0.0 F1：模板解析服务化 ----
  // 只读解析：返回 pick() 副本（无内部引用泄漏）；缺失返回 undefined。
  // 消费方：dsh-subdisp dispatch 时刻填充（§2.1）。忙态门控不在此服务（编辑走 RPC，见 apply-template-config）。
  ctx.provide('subagentTemplateControl', {
    resolveBinding: (ownerId, preset) => resolveOverride(ownerId, preset), // live 直读（W7 依赖，签名语义不变）
    // v2.0.3 推模式：subdisp 在派遣/结算点推送后代增减（唯一双向验证可用的跨插件通道）
    reportDescendant: (payload) => reportDescendant(payload),
    // v2.0.4 忙世代快照（蓝图 busy-generation-snapshot §2.2）：下列三方法仅供 host 内部
    // 跨插件调用（subdisp dispatchFill），不进 client 7-wire 面（client.js 零改动）。
    snapshotGlobalForSession: (rootId) => snapshotGlobalForSession(rootId),
    releaseGlobalSnapshot: (rootId) => releaseGlobalSnapshot(rootId), // 幂等
    resolveBindingForRoot: (ownerId, preset) => resolveForRoot(ownerId, preset),
  })

  // ---- 蓝图 fill-only-model-default v2.0.3 F4/N5：忙态维护 ----
  // Busy(X) := MainTurnActive(X) OR HasActiveDescendants(X)
  // - MainTurnActive：监听 agent/status（线上验证可达），仅主 agent 的 running/idle 翻转；
  //   agent/disposed 兜底清理主 turn。
  // - HasActiveDescendants（v2.0.3 推模式）：**dsh-subdisp 在每个派遣/结算点经
  //   subagentTemplateControl.reportDescendant 主动推送**后代增减。
  //   根因记录：agent/created 事件对本插件不可达（2026-08-22 线上实测：探针级监听器
  //   收到 created:5 而本插件同形监听器静默无收；同宿主 agent/status/request 可达）；
  //   ctx.get/inject 拉取 subagentDispatch 亦不可达。唯一双向验证可用的通道是
  //   「subdisp 经 agent ctx 调用本插件 provide」——推模式即建立在该通道上。
  const busyMainTurns = new Set()
  const busyTestOverrides = new Map() // sessionId -> boolean（__testHooks.setBusy 直写，优先于事件态）
  const sessionParent = new Map() // childSessionId -> parentSessionId（由 subdisp 推送）
  const activeDescendants = new Map() // sessionId -> 活跃后代数（直接 + 间接）

  const headerOf = (agent) => {
    if (agent === null || typeof agent !== 'object' || agent === undefined) return undefined
    const session = agent.session
    const header = session !== null && typeof session === 'object' && session !== undefined
      ? session.header
      : undefined
    if (header === null || typeof header !== 'object' || header === undefined) return undefined
    if (typeof header.id !== 'string' || header.id === '') return undefined
    return header
  }

  ctx.on('agent/status', ({ agent, status }) => {
    const header = headerOf(agent)
    if (header === undefined) return
    if (header.origin === 'subagent') return // 只跟踪主 agent；子代理由推模式计数覆盖
    // v2.0.4：prev 忙态在变更前捕获，随后驱动 busy 翻转检测（快照拍/释边沿）
    const prevBusy = isSessionBusy(header.id)
    if (status === 'running') busyMainTurns.add(header.id)
    else if (status === 'idle') busyMainTurns.delete(header.id)
    checkBusyTransition(header.id, prevBusy)
  })

  // 推模式结算：若仍有在途后代，先过继给祖父再清链（父先孙后拓扑防泄漏）
  const settleDescendant = (sessionId) => {
    if ((activeDescendants.get(sessionId) || 0) > 0) {
      const grandparent = sessionParent.get(sessionId)
      for (const [cid, pid] of sessionParent) {
        if (pid === sessionId) sessionParent.set(cid, grandparent)
      }
    }
    const parent = sessionParent.get(sessionId)
    let id = parent
    while (id !== undefined && id !== '') {
      const n = (activeDescendants.get(id) || 0) - 1
      if (n <= 0) activeDescendants.delete(id)
      else activeDescendants.set(id, n)
      id = sessionParent.get(id)
    }
    sessionParent.delete(sessionId)
    activeDescendants.delete(sessionId)
    busyMainTurns.delete(sessionId)
  }

  // 推模式入口（subdisp 调用）：created 记链自增；settled 过继归还
  // v2.0.4：两分支在计数变更前后对受影响祖先链做 busy 翻转检测（快照拍/释边沿）。
  const reportDescendant = ({ event, childSessionId, parentSession }) => {
    if (typeof childSessionId !== 'string' || childSessionId === '') return
    if (event === 'created') {
      if (typeof parentSession !== 'string' || parentSession === '') return
      if (sessionParent.has(childSessionId)) return // 重复推送幂等
      sessionParent.set(childSessionId, parentSession)
      // 受影响祖先链（含 parentSession 自身）与各自 prev 忙态须在计数自增前捕获
      const affected = ancestorsOf(parentSession)
      const prevs = affected.map((id) => isSessionBusy(id))
      let id = parentSession
      while (id !== undefined && id !== '') {
        activeDescendants.set(id, (activeDescendants.get(id) || 0) + 1)
        id = sessionParent.get(id)
      }
      for (let i = 0; i < affected.length; i++) checkBusyTransition(affected[i], prevs[i])
    } else if (event === 'settled') {
      if (!sessionParent.has(childSessionId)) return // 未记录过的结算幂等忽略
      // 原祖先链（child 自身 + 父及以上；settleDescendant 的过继只改 child 的子指针，
      // 不改此链）与各自 prev 忙态须在计数归还前捕获；减完后对整条链做翻转检查
      const affected = ancestorsOf(childSessionId)
      const prevs = affected.map((id) => isSessionBusy(id))
      settleDescendant(childSessionId)
      for (let i = 0; i < affected.length; i++) checkBusyTransition(affected[i], prevs[i])
    }
  }

  ctx.on('agent/disposed', ({ agent }) => {
    const header = headerOf(agent)
    if (header === undefined) return
    // 仅主 agent 走此清理；子代理结算以 subdisp 推送为准（避免双通道双计）
    if (header.origin !== 'subagent') {
      // v2.0.4：清理后驱动翻转检测——孙仍在途（activeDescendants>0）则仍忙、快照保持
      const prevBusy = isSessionBusy(header.id)
      busyMainTurns.delete(header.id)
      checkBusyTransition(header.id, prevBusy)
    }
  })

  const isSessionBusy = (sessionId) => {
    const override = busyTestOverrides.get(sessionId)
    if (override !== undefined) return override
    if (busyMainTurns.has(sessionId)) return true
    return (activeDescendants.get(sessionId) || 0) > 0
  }

  // ---- 蓝图 busy-generation-snapshot v2.0.4 F2：忙世代 global 快照层 ----
  // 快照只在 busy false→true 边沿拍摄（同忙世代不重拍）、true→false 边沿释放；
  // 仅克隆 global 层——X 的 session 层忙态双门控天然不可写（蓝图难点 2）；
  // 内存态不持久化（host 重启即弃，重启后世界线=全部落盘终值，符合 N2 终态）。
  const globalSnapshots = new Map() // rootId -> Map<presetId, pick() 副本>

  // 同步克隆（无 await）：JS 单线程事件循环保证与 mutationChain 的同步 mutation 段
  // 必有完整先后顺序、绝不交错 → 天然原子，无需进 mutationChain（蓝图难点 4）。
  const cloneGlobalLayer = () => {
    const snap = new Map()
    for (const [id, o] of globalOverrides) snap.set(id, pick(o))
    return snap
  }

  // 沿推模式 sessionParent 链上溯求根（与 activeDescendants 同源同 tick 一致）。
  // 断链兜底：终点即所达最高祖先；无快照命中则回落 live（等价 v2.0.3，安全降级）。
  const rootOf = (sessionId) => {
    let id = sessionId
    while (id !== undefined && id !== '' && sessionParent.has(id)) {
      id = sessionParent.get(id)
    }
    return id
  }

  // 自身 + 全部祖先（沿链收集；busy 翻转检查的受影响集合）
  const ancestorsOf = (sessionId) => {
    const chain = []
    let id = sessionId
    while (id !== undefined && id !== '') {
      chain.push(id)
      if (!sessionParent.has(id)) break
      id = sessionParent.get(id)
    }
    return chain
  }

  const snapshotGlobalForSession = (rootId) => {
    if (rootId === undefined || rootId === '') return
    if (globalSnapshots.has(rootId)) return // 同忙世代幂等，保轮初值
    globalSnapshots.set(rootId, cloneGlobalLayer())
  }

  const releaseGlobalSnapshot = (rootId) => {
    if (rootId === undefined || rootId === '') return
    globalSnapshots.delete(rootId) // 幂等
  }

  // 忙世代解析（蓝图 §2.2）：ownerId session 层（live，忙态天然不可变）
  //   > root 的忙初 global 快照（D3：快照存在且该 preset 无条目 → 不回落 live，
  //     防 Y 忙期为新 preset 增配渗透进 X 忙期派遣）
  //   > live global 层（无快照 = root 不忙 or 断链降级，等价 v2.0.3 行为）
  const resolveForRoot = (ownerId, preset) => {
    if (ownerId !== undefined) {
      const byPreset = sessionOverrides.get(ownerId)
      if (byPreset !== undefined) {
        const o = layerOf(byPreset, preset)
        if (o !== undefined) return o
      }
    }
    const root = rootOf(ownerId)
    if (root !== undefined && globalSnapshots.has(root)) {
      const o = layerOf(globalSnapshots.get(root), preset)
      if (o !== undefined) return o
      return undefined
    }
    return layerOf(globalOverrides, preset)
  }

  // busy 边沿检测器（蓝图 §2.3）：prev 由各变更点在变更前捕获。
  // 拍摄键 = rootOf(X)（X 自身即根时 rootOf=X）；释放键 = X 自身——中间节点翻转
  // 释放的是自己的键（通常不存在，no-op），root 键不受影响：孙在途时根快照保持。
  const checkBusyTransition = (sessionId, prevBusy) => {
    if (typeof sessionId !== 'string' || sessionId === '') return
    const now = isSessionBusy(sessionId)
    if (!prevBusy && now) snapshotGlobalForSession(rootOf(sessionId))
    else if (prevBusy && !now) releaseGlobalSnapshot(sessionId)
  }

  /** 校验 scope 参数；session 层返回 ownerId，global 层返回 undefined。 */
  const resolveScope = (args) => {
    const scope = args.scope === undefined ? 'global' : String(args.scope)
    if (scope !== 'global' && scope !== 'session') {
      throw new Error('scope must be "global" or "session"')
    }
    if (scope !== 'session') return { scope, ownerId: undefined }
    const ownerId = typeof args.sessionId === 'string' && args.sessionId !== '' ? args.sessionId : undefined
    if (ownerId === undefined) {
      throw new Error('scope:"session" requires sessionId')
    }
    return { scope, ownerId }
  }

  // Wire table: kebab wire name -> handler(args). Bodies are the resident
  // port's business logic, unchanged.
  const handlers = {
    'list-templates': async () => {
      const rows = await ctx.agentPresets.list()
      const out = []
      for (const row of rows) {
        out.push({
          id: String(row.id),
          name: row.name !== undefined ? String(row.name) : String(row.id),
          description: row.description !== undefined ? String(row.description) : '',
          trust: String(row.trust),
          // 透出本体 roster 的 broken 诊断：坏 composition 的 preset 在
          // 面板显示禁用态与原因，而不是派遣时深层中断。
          ...row.broken !== undefined ? { broken: String(row.broken) } : {},
        })
      }
      return out
    },

    'list-template-configs': async () => {
      const global = {}
      for (const [id, o] of globalOverrides) global[String(id)] = pick(o)
      const sessions = {}
      for (const [ownerId, byPreset] of sessionOverrides) {
        if (byPreset.size === 0) continue
        const layer = {}
        for (const [id, o] of byPreset) layer[String(id)] = pick(o)
        sessions[String(ownerId)] = layer
      }
      // v2.0.0 F4：附忙态表供面板初始渲染（get-panel-state 提供后续轮询）
      const busySessions = {}
      for (const id of busyMainTurns) busySessions[String(id)] = true
      for (const id of busyTestOverrides.keys()) {
        if (busyTestOverrides.get(id) === true) busySessions[String(id)] = true
      }
      // v2.0.2：并含「仅子代理在途」来源（主 turn 已 idle 的会话）——自治 activeDescendants 表
      for (const id of activeDescendants.keys()) busySessions[String(id)] = true
      return { global, sessions, busySessions }
    },

    // v2.0.0 F4：面板忙态查询（面板打开期间 ~1s 轮询）
    'get-panel-state': async (args) => {
      const editorId = typeof args.editorSessionId === 'string' && args.editorSessionId !== ''
        ? args.editorSessionId
        : undefined
      return { busy: editorId !== undefined ? isSessionBusy(editorId) : false }
    },

    'get-template-config': async (args) => {
      const { ownerId } = resolveScope(args)
      // 按 scope 返回该层原值（蓝图 2.2），非生效合并值；层缺失或条目缺失返回 null。
      const layer = ownerId === undefined ? globalOverrides : sessionOverrides.get(ownerId)
      const o = layer !== undefined ? layer.get(String(args.presetId)) : undefined
      return o === undefined ? null : pick(o)
    },

    'apply-template-config': async (args) => {
      // v2.0.0 F3/N5 写侧门控：面板所属会话忙 → 无效化（拒绝），无论 scope。
      // editorSessionId 为新增字段（客户端面板必传本会话 id）；原 sessionId 语义不变（session 层 ownerId）。
      const editorId = typeof args.editorSessionId === 'string' && args.editorSessionId !== ''
        ? args.editorSessionId
        : undefined
      if (editorId !== undefined && isSessionBusy(editorId)) {
        return { ok: false, busy: true,
          message: '会话执行中（主 agent 或子 agent 在途），子Agent模板已无效化；执行完毕后再修改。' }
      }
      // v2.0.0 N5-c：会话层只允许编辑自己的层（跨会话层编辑拒绝）。
      const scopeNow = args.scope === undefined ? 'global' : String(args.scope)
      if (scopeNow === 'session' && args.sessionId !== editorId) {
        return { ok: false, message: 'scope:"session" 只允许编辑本会话的模板层。' }
      }
      const operation = mutationChain.catch(() => {}).then(async () => {
        const { ownerId } = resolveScope(args)
        const layer = ownerId === undefined
          ? globalOverrides
          : sessionOverrides.get(ownerId) ?? sessionOverrides.set(ownerId, new Map()).get(ownerId)
        const id = String(args.presetId)
        const hadCurrent = layer.has(id)
        const current = layer.get(id)
        let next = current !== undefined ? { ...current } : {}
        if (args.clear === true) {
          next = {}
        } else {
          if (args.provider !== undefined) next.provider = String(args.provider)
          if (args.model !== undefined) next.model = String(args.model)
          if (args.effort !== undefined) {
            const v = String(args.effort)
            if (v === '') delete next.effort
            else next.effort = v
          }
        }
        if (next.effort !== undefined && next.provider !== undefined && next.model !== undefined) {
          let info
          try {
            info = await ctx.llm.resolveModelInfo(next.provider, next.model)
          } catch (err) {
            return { ok: false, message: '\u65E0\u6CD5\u89E3\u6790\u6A21\u578B ' + next.provider + '/' + next.model + ': ' + String(err && err.message ? err.message : err) }
          }
          const available = info.reasoning !== undefined && Array.isArray(info.reasoning.efforts)
            ? info.reasoning.efforts.map((entry) => entry.id)
            : []
          if (available.length > 0 && !available.includes(next.effort)) {
            return { ok: false, message: '\u6A21\u578B ' + next.provider + '/' + next.model + ' \u4E0D\u652F\u6301\u5F3A\u5EA6 "' + next.effort + '"\uFF08\u53EF\u7528: ' + available.join(', ') + '\uFF09' }
          }
        }
        if (Object.keys(next).length === 0) layer.delete(id)
        else layer.set(id, next)
        if (ownerId !== undefined && layer.size === 0) sessionOverrides.delete(ownerId)
        try {
          // B4: persistence errors are returned to the caller; never report
          // ok:true for an in-memory-only mutation.
          await persistOverrides(globalOverrides, sessionOverrides)
        } catch (err) {
          if (hadCurrent) layer.set(id, current)
          else layer.delete(id)
          // 无条件恢复映射：正向路径可能已 sessionOverrides.delete(ownerId)，
          // 条件判空会漏恢复，内存静默丢层后下次成功写盘即永久丢失。
          if (ownerId !== undefined) sessionOverrides.set(ownerId, layer)
          throw err
        }
        return { ok: true, override: pick(next) }
      })
      mutationChain = operation
      return operation
    },

    'list-models': async () => {
      const providers = ctx.llm.listProviders()
      const entries = await Promise.all(providers.map(async (providerInfo) => {
        let models = []
        try {
          models = await ctx.llm.listModels(providerInfo.id)
        } catch (err) {
          models = []
        }
        return {
          provider: providerInfo.id,
          name: providerInfo.name,
          models: models.map((m) => ({ id: m.id, name: m.name })),
        }
      }))
      return entries
    },

    'resolve-efforts': async (args) => {
      const info = await ctx.llm.resolveModelInfo(String(args.provider), String(args.model))
      const reasoning = info.reasoning
      const efforts = reasoning !== undefined && Array.isArray(reasoning.efforts)
        ? reasoning.efforts.map((entry) => ({ id: entry.id, name: entry.name }))
        : []
      const out = { provider: info.provider, model: info.id, efforts }
      if (reasoning !== undefined && reasoning.defaultEffort !== undefined) out.defaultEffort = reasoning.defaultEffort
      return out
    },
  }

  async function handle(req, res) {
    const send = (status, payload) => {
      const body = JSON.stringify(payload)
      res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
      res.end(body)
    }
    if (req.method !== 'POST') {
      return send(405, { ok: false, message: 'POST required' })
    }
    let raw = ''
    req.setEncoding('utf8')
    for await (const chunk of req) {
      raw += chunk
      if (raw.length > MAX_BODY_BYTES) {
        return send(413, { ok: false, message: 'request body too large' })
      }
    }
    let message
    try {
      message = JSON.parse(raw === '' ? '{}' : raw)
    } catch (err) {
      return send(400, { ok: false, message: 'request body is not JSON' })
    }
    if (message === null || typeof message !== 'object') {
      return send(400, { ok: false, message: 'request body must be a JSON object' })
    }
    const method = typeof message.method === 'string' ? message.method : ''
    const fn = Object.prototype.hasOwnProperty.call(handlers, method) ? handlers[method] : undefined
    if (fn === undefined) {
      return send(404, { ok: false, message: 'unknown method: ' + String(method) })
    }
    const args = message.args !== null && typeof message.args === 'object' ? message.args : {}
    try {
      const value = await fn(args)
      send(200, { ok: true, value })
    } catch (err) {
      send(200, { ok: false, message: String(err && err.message ? err.message : err) })
    }
  }

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: RPC_PATH,
    handler: (req, res) => {
      handle(req, res).catch(() => {
        try {
          res.writeHead(500, { 'content-type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ ok: false, message: 'internal error' }))
        } catch (err) { /* response already started */ }
      })
    },
  }), 'dsh-subctl: ' + RPC_PATH + ' route')

  // v2.0.0 F2：hook 唯一职责 = 把 dispatch 时刻冻结的模板 effort 安全写入每请求 config。
  // 不再读 live resolveOverride（N5 在途免疫）；不再需要 origin/preset/ownerId/B2 解析——
  // 冻结快照只存在于「经 subdisp 模板派遣」的子代理 options 上，其存在性即全部前提
  // （B1/B2/B3 语义全部上移到 dsh-subdisp dispatchFill 源头收口；B5 说明保留：
  //   agent/request 官方 payload 只有 { agent, turn, step, signal }，标题生成走
  //   ctx.llm.stream({ purpose: 'session-title' })、compaction 走 agent/pre-step/request-error，
  //   都不进本 waterfall，无需 reason 过滤）。
  // N2′ 成立性：模板 model 仅在 dispatch 时刻进入 agentOptions（种子层）；此后
  // installModelSelection 每请求 stamp UI 选择 → 天然覆盖；本 hook 不再触碰 provider/model。
  const effortSupportedCache = new Map() // ${provider}/${model} -> Set<effortId>（空集 = 模型无 reasoning；throw 永不写入）
  // 命名函数形式（镜像 effort-clamp v1.0.3+）：test seam（__testHooks.requestHook）可直接引用，
  // 避免 v1.0.2 匿名箭头 + __testHooks 引用 requestHook 标识符时的 ReferenceError。
  const requestHook = async (payload, next) => {
    const config = await next()
    if (payload === null || typeof payload !== 'object' || payload.agent === undefined) return config
    const agentObj = payload.agent
    const opts = agentObj !== null && typeof agentObj === 'object' ? agentObj.options : undefined
    const frozen = opts !== null && typeof opts === 'object' && opts !== undefined
      ? opts.subagentTemplateBinding
      : undefined
    if (frozen === null || typeof frozen !== 'object' || frozen === undefined) return config
    const out = { ...config }
    // N4（保留）：对「最终每请求模型」做 supports 校验——UI 中途切模型后模板 effort 可能
    // 不再被支持 → 静默丢弃（llm 物化 defaultEffort 兜底，v1.0.4 语义）
    if (frozen.effort !== undefined && out.reasoningEffort === undefined) {
      const cacheKey = out.provider + '/' + out.model
      let supported = effortSupportedCache.get(cacheKey)
      if (supported === undefined) {
        try {
          const info = await ctx.llm.resolveModelInfo(out.provider, out.model)
          const efforts2 = info.reasoning && Array.isArray(info.reasoning.efforts)
            ? info.reasoning.efforts.map((e) => e.id)
            : []
          supported = new Set(efforts2)
        } catch {
          // 网络/未知模型抖动：放行让 llm 终门决定；不缓存失败（避免一次抖动锁死整个模型）
          return out
        }
        effortSupportedCache.set(cacheKey, supported)
      }
      if (supported.has(frozen.effort)) out.reasoningEffort = frozen.effort
      // 不支持 → 静默丢弃 → llm 物化 defaultEffort（v1.0.4 语义）
    }
    return out
  }
  ctx.on('agent/request', requestHook)

  // 蓝图 fill-only-model-default v1.0.4 F3：subctl 此前无 dispose handler，新加
  // （与 dsh-subdisp v1.0.4 §2.3 dispose 清缓存语义一致）
  ctx.on('dispose', () => {
    effortSupportedCache.clear()
    busyMainTurns.clear()
    busyTestOverrides.clear()
    sessionParent.clear()
    activeDescendants.clear()
    globalSnapshots.clear() // v2.0.4：忙世代快照为内存态，dispose 即弃（不持久化）
  })

  // 蓝图 fill-only-model-default v1.0.4 F5：test seam 桥接（test-only API）
  // setBinding/getBinding 按 (ownerId, preset, scope) 三键操控 apply 闭包内的覆盖表
  __testHooks = {
    setBinding: ({ ownerId, preset, scope }, override) => {
      const id = String(preset)
      if (scope === 'session') {
        let layer = sessionOverrides.get(ownerId)
        if (layer === undefined) {
          layer = new Map()
          sessionOverrides.set(ownerId, layer)
        }
        if (override === undefined || override === null) layer.delete(id)
        else layer.set(id, pick(override))
      } else {
        if (override === undefined || override === null) globalOverrides.delete(id)
        else globalOverrides.set(id, pick(override))
      }
    },
    getBinding: ({ ownerId, preset, scope }) => {
      const id = String(preset)
      // v1.0.5 修复：缺 binding 时直接返回 undefined；不再调 pick(undefined)（pick() 会解引用 o.provider 导致 TypeError）。
      // Mirror dsh-subdisp lib/index.js:694 的 getBinding 语义——缺则 undefined，存则 pick 后的副本。
      if (scope === 'session') {
        const layer = sessionOverrides.get(ownerId)
        if (layer === undefined) return undefined
        const v = layer.get(id)
        return v === undefined ? undefined : pick(v)
      }
      const v = globalOverrides.get(id)
      return v === undefined ? undefined : pick(v)
    },
    requestHook,
    cacheSize: () => effortSupportedCache.size,
    cacheKeys: () => Array.from(effortSupportedCache.keys()),
    clearCache: () => effortSupportedCache.clear(),
    // v2.0.3 §2.8：忙态操控（绕过事件源，单测 RPC 门控）+ 服务面直读 + 推模式模拟
    // v2.0.4：setBusy 驱动 busy 翻转检测（快照拍/释），使 W14-W20 可脱离事件源单测；
    // prev 取 isSessionBusy（含 override）变更前的值（蓝图 R7）。
    setBusy: (sessionId, busy) => {
      const prev = isSessionBusy(sessionId)
      if (busy) busyTestOverrides.set(sessionId, true)
      else busyTestOverrides.set(sessionId, false)
      checkBusyTransition(sessionId, prev)
    },
    isSessionBusy: (sessionId) => isSessionBusy(sessionId),
    resolveBinding: (ownerId, preset) => resolveOverride(ownerId, preset),
    reportDescendant: (payload) => reportDescendant(payload),
    activeDescendantCount: (sessionId) => activeDescendants.get(sessionId) || 0,
    // v2.0.4 §2.8：忙世代快照操控 + 直读 + 计数（W14-W20 单测面）
    snapshotGlobalForSession: (rootId) => snapshotGlobalForSession(rootId),
    releaseGlobalSnapshot: (rootId) => releaseGlobalSnapshot(rootId),
    resolveBindingForRoot: (ownerId, preset) => resolveForRoot(ownerId, preset),
    globalSnapshotCount: () => globalSnapshots.size,
  }
}
