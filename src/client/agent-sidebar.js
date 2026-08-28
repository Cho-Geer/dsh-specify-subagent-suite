// RESIDENT PORT of scratch/subagent-sidebar-client.js (dynamic -> permanent browser half).
//
// MERGE NOTE (Phase 1.5, re-applied at v8 re-sync): exports a factory
// function (no load wrapper) that the merged entry requires. R20 dedup guard
// re-applied to `styles.insert` (prevents HMR style accumulation).
function factory(require) {
    const React = require('react')
    const styles = {
      insert(cssText) {
        if (typeof document === 'undefined') return
        const tagId = 'dsh-specify-subagent-suite/agent-sidebar'
        if (document.querySelector('style[data-plugin-css="' + tagId + '"]') !== null) return
        const el = document.createElement('style')
        el.dataset.plugin = 'dsh-specify-subagent-suite'
        el.dataset.pluginCss = tagId
        el.textContent = cssText
        ;(document.head || document.documentElement).appendChild(el)
      },
    }
    const plugin = {
      inject: ['slots', 'sessions', 'layout'],
      apply(ctx) {
    const slots = ctx.get('slots')
    const sessions = ctx.get('sessions')
    const layout = ctx.get('layout')
    if (slots === undefined || sessions === undefined || layout === undefined) return

    styles.insert(`
      .sbx-host { display: flex; flex-direction: column; width: 100%; height: 100%; min-height: 0; box-sizing: border-box; background: var(--dsw-specific-menu, rgba(24,26,32,0.98)); }
      .sbx-tabs { display: flex; gap: 4px; padding: 8px 8px 0; border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.16)); flex: none; }
      .sbx-tab { flex: 1; min-width: 0; border: none; background: transparent; color: var(--dsw-alias-label-secondary, #bbb); font-size: 12px; line-height: 18px; padding: 6px 4px; border-radius: 6px 6px 0 0; cursor: pointer; white-space: nowrap; }
      .sbx-tab:hover { color: var(--dsw-alias-label-primary, #e8e8e8); }
      .sbx-tab-active { color: var(--dsw-alias-label-primary, #e8e8e8); background: var(--dsw-interactive-bg-hover, rgba(255,255,255,0.06)); }
      /* 合并后的 toggle 按钮：默认恒显，由 RestoreButton 根据祖先 data-details-collapsed
         切换 icon/title/onClick；不再用 CSS 互斥显隐。 */
      .sbx-restore { position: absolute; top: 50%; right: 0; transform: translateY(-50%); display: flex; align-items: center; justify-content: center; width: 18px; height: 64px; background: var(--dsw-interactive-bg-hover, rgba(255,255,255,0.06)); border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.25)); border-right: none; border-radius: 8px 0 0 8px; color: var(--dsw-alias-label-secondary, #bbb); font-size: 12px; cursor: pointer; z-index: 5; box-sizing: border-box; }
      .sbx-restore:hover { color: var(--dsw-alias-label-primary, #e8e8e8); background: var(--dsw-interactive-bg-hover, rgba(255,255,255,0.12)); }
      .sbx-body { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 8px; font-size: 12px; color: var(--dsw-alias-label-secondary, #bbb); }
      .sbx-empty { color: var(--dsw-alias-label-tertiary, #888); padding: 12px 4px; font-size: 12px; }
      .sbx-hint { color: var(--dsw-alias-label-tertiary, #888); padding: 8px 7px; font-size: 11px; font-style: italic; }
      .sbx-row { display: flex; align-items: center; gap: 6px; padding: 5px 6px; border-radius: 6px; cursor: pointer; }
      .sbx-row:hover { background: var(--dsw-interactive-bg-hover, rgba(255,255,255,0.06)); }
      .sbx-dot { width: 8px; height: 8px; flex: none; border-radius: 50%; }
      .sbx-dot-run { background: #7cb305; box-shadow: 0 0 6px rgba(124,179,5,0.55); }
      .sbx-dot-done { background: var(--dsw-alias-border-l2, #555); }
      .sbx-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--dsw-alias-label-primary, #e8e8e8); }
      .sbx-meta { color: var(--dsw-alias-label-tertiary, #888); font-size: 11px; flex: none; }
      .sbx-chev { flex: none; color: var(--dsw-alias-label-tertiary, #888); font-size: 10px; padding: 2px 4px; border-radius: 4px; cursor: pointer; }
      .sbx-chev:hover { background: var(--dsw-interactive-bg-hover, rgba(255,255,255,0.10)); }
      .sbx-progress { display: flex; gap: 6px; flex-wrap: wrap; padding: 6px 2px 8px; color: var(--dsw-alias-label-tertiary, #999); font-size: 11px; }
      .sbx-todo { display: flex; gap: 6px; align-items: flex-start; padding: 4px 2px; }
      .sbx-todo-content { color: var(--dsw-alias-label-primary, #e8e8e8); word-break: break-word; min-width: 0; }
      .sbx-glyph { flex: none; width: 14px; height: 14px; margin-top: 1px; color: var(--dsw-alias-label-tertiary, #888); }
      .sbx-glyph-done { color: #389e0d; }
      .sbx-glyph-prog { color: var(--dsw-alias-state-info-primary, #1890ff); }
      @keyframes sbx-progress-spin { to { transform: rotate(360deg); } }
      .sbx-glyph-prog { animation: sbx-progress-spin 1s linear infinite; transform-origin: 50% 50%; }
      @media (prefers-reduced-motion: reduce) { .sbx-glyph-prog { animation: none; } }
      .sbx-call { border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.12)); padding: 6px 2px; }
      .sbx-call-head { display: flex; align-items: center; gap: 6px; cursor: pointer; }
      .sbx-call-name { color: var(--dsw-alias-label-primary, #e8e8e8); font-family: var(--dsw-font-mono, monospace); font-size: 11px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
      .sbx-call-co { color: var(--dsw-alias-label-tertiary, #888); font-size: 11px; flex: none; }
      .sbx-call-exp { margin-top: 6px; padding: 6px 8px; background: var(--dsw-fill-l2, rgba(255,255,255,0.05)); border-radius: 6px; white-space: pre-wrap; word-break: break-word; font-family: var(--dsw-font-mono, monospace); font-size: 11px; max-height: 260px; overflow: auto; color: var(--dsw-alias-label-secondary, #bbb); }
      .sbx-call-err { color: var(--dsw-alias-state-error-primary, #ff7875); }
    `)

    // K4b 修复（2026-08-23）：apply 时机布局根节点尚未首渲染，LayoutController
    // 的 panel actions 尚未接线（ui-layout service.ts#require：root entry 首渲染
    // 前调用属 boot-order bug）。此处原先的立即 openDetails() 已删除：面板
    // 挂载后由 SidebarPanel 的被动 useEffect 自动展开（见下），apply 无需
    // 也无法在此时机开列。

    // 手动收起标志：用户用 › 收起后（userCollapsed=true），会话切换不再自动重开。
    // 重开逻辑在组件用被动 useEffect 完成（晚于 AppFrame 的 layout-effect closeDetails）。
    let userCollapsed = false

    // ---- 纯 helpers ----
    const textOf = (blocks) => {
      if (!Array.isArray(blocks)) return ''
      return blocks.filter(b => b && typeof b === 'object' && b.type === 'text')
        .map(b => (typeof b.text === 'string' ? b.text : '')).join('')
    }
    const pretty = (raw) => {
      if (typeof raw !== 'string' || raw === '') return raw
      try { return JSON.stringify(JSON.parse(raw), null, 2) } catch (e) { return raw }
    }

    const glyphIcon = (status) => {
      const cls = status === 'completed' ? 'sbx-glyph sbx-glyph-done'
        : status === 'in_progress' ? 'sbx-glyph sbx-glyph-prog' : 'sbx-glyph'
      if (status === 'completed') {
        return React.createElement('svg', { key: 'g' + status, viewBox: '0 0 14 14', width: 14, height: 14, className: cls, 'aria-hidden': true },
          React.createElement('circle', { cx: 7, cy: 7, r: 6.4, stroke: 'currentColor', strokeWidth: 1.2, fill: 'none' }),
          React.createElement('path', { d: 'M10.96 5.71l-3.26 3.27a3.9 3.9 0 01-.55.52c-.2.16-.42.3-.73.35-.16.02-.32.02-.48 0-.3-.05-.53-.19-.73-.35a3.9 3.9 0 01-.61-.57l-1.51-1.51.93-.93 1.51 1.51c.24.24.39.39.5.48.11.08.13.08.11.08 0 .02 0 .05-.02a3.4 3.4 0 01.5-.04l3.26-3.26.93.93z', fill: 'currentColor' }),
        )
      }
      if (status === 'in_progress') {
        return React.createElement('svg', { key: 'g' + status, viewBox: '0 0 14 14', width: 14, height: 14, className: cls, 'aria-hidden': true },
          React.createElement('circle', { cx: 7, cy: 7, r: 6.4, stroke: 'currentColor', strokeWidth: 1.2, fill: 'none', strokeDasharray: '30 14', strokeLinecap: 'round' }),
        )
      }
      return React.createElement('svg', { key: 'g' + status, viewBox: '0 0 14 14', width: 14, height: 14, className: cls, 'aria-hidden': true },
        React.createElement('circle', { cx: 7, cy: 7, r: 6.4, stroke: 'currentColor', strokeWidth: 1.2, fill: 'none', strokeDasharray: '2.4 2.4' }),
      )
    }

    const todoRow = (item, idx) => {
      if (!item || typeof item !== 'object') return null
      const status = item.status === 'in_progress' || item.status === 'completed' ? item.status : 'pending'
      return React.createElement('div', { key: 't' + idx + '-' + (item.content || ''), className: 'sbx-todo' },
        glyphIcon(status),
        React.createElement('span', { className: 'sbx-todo-content' }, item.content || ''),
      )
    }

    // ---- 组件：右侧栏三 tab ----
    function SidebarPanel(props) {
      const { sessionId, useSession, useSessions, useProjection, useChat, openSubagent, setCatalogOpen, openDetails } = props
      const [tab, setTab] = React.useState('agents')
      const [expanded, setExpanded] = React.useState({})
      // Q3 修复：默认展开全部嵌套层级。原一次性布尔守卫（expandedInitDoneRef）在深层
      // 目录懒加载到达前就关门，导致只有第一层被自动展开。改为增量扩张：
      // - autoSeenRef：已自动展开过的目录 id（避免重复扩张同一目录）
      // - userTouchedRef：用户手动点过 chevron 的目录 id（用户语义优先，不再自动碰）
      // 深层目录数据每到达一层，effect 对新出现的 hasChildren 条目补展开一层。
      const autoSeenRef = React.useRef(null)
      const userTouchedRef = React.useRef(null)

      const byId = useSessions(s => s.byId)
      const catalogs = useSessions(s => s.subagentsByParent)
      const todosProj = useProjection('todos')
      // 2026-08-28 工具详情看板空白修复：本体 0.1.2 已把会话内容从 useSession
      // （SessionSnapshot，现仅生命周期/控制字段）迁至 uiChat 贡献的 useChat
      // （ChatSnapshot）。旧字段在 SessionSnapshot 上恒为 undefined（本看板空白
      // 的根因）。改读 ChatSnapshot 的 legacy 兼容切片（LegacyConversationSlice）：
      // nodes 与 runningCalls 都在 legacy 内（ChatSnapshot 顶层没有 runningCalls，
      // 本体 StatsLine 同通道）。useChat 缺席（旧本体/未注入）时降级为空数组，
      // 面板保持可用。
      const chat = typeof useChat === 'function' ? useChat(s => s) : undefined
      const nodes = chat !== undefined && chat.legacy !== undefined ? chat.legacy.nodes : []
      const runningCalls = chat !== undefined && chat.legacy !== undefined ? chat.legacy.runningCalls : []

      // 始终显示主会话（沿 parentId 向上走到非 subagent 的根祖先）的 agent 列表；
      // 首次解析的结果用 useState 钉住，避免瞬态空目录抖动。
      const resolvedMain = (() => {
        if (sessionId === undefined) return undefined
        let sid = sessionId
        for (let i = 0; i < 64; i++) {
          const rec = byId[sid]
          if (rec === undefined || rec.origin !== 'subagent') return sid
          if (rec.parentId === undefined) return sid
          sid = rec.parentId
        }
        return sid
      })()
      const [mainSessionId, setMainSessionId] = React.useState(null)
      React.useEffect(() => {
        if (mainSessionId === null && resolvedMain !== undefined) setMainSessionId(resolvedMain)
      }, [mainSessionId, resolvedMain])
      const listRootId = mainSessionId ?? resolvedMain

      // 会话切换时 AppFrame 的 useLayoutEffect 会 closeDetails（AppFrame.tsx:101-108）。
      // 被动 useEffect 在该 commit 的全部 layout effects 之后才执行。openDetails
      // 幂等，不会抖动。这里去掉 userCollapsed 的早返回：会话切换强制重开，
      // 让侧栏默认始终保持展开状态。
      React.useEffect(() => {
        try { openDetails() } catch (e) { console.error('sbx: reopen failed', e) }
      }, [sessionId])

      // 默认展开所有 hasChildren 的目录节点（增量）：catalogs 每次变化（含深层目录
      // 懒加载到达）时，对尚未自动展开过、且用户没手动碰过的 hasChildren 条目补展开。
      React.useEffect(() => {
        if (autoSeenRef.current === null) autoSeenRef.current = new Set()
        if (userTouchedRef.current === null) userTouchedRef.current = new Set()
        const idsToExpand = []
        for (const _parent of Object.keys(catalogs || {})) {
          const cat = catalogs[_parent]
          if (cat && Array.isArray(cat.entries)) {
            for (const entry of cat.entries) {
              if (entry && entry.kind === 'child' && entry.hasChildren
                && !autoSeenRef.current.has(entry.id)
                && !userTouchedRef.current.has(entry.id)) {
                idsToExpand.push(entry.id)
              }
            }
          }
        }
        if (idsToExpand.length === 0) return
        for (const id of idsToExpand) autoSeenRef.current.add(id)
        setExpanded((prev) => {
          const next = { ...prev }
          let changed = false
          for (const id of idsToExpand) {
            if (!next[id]) { next[id] = true; changed = true }
          }
          return changed ? next : prev
        })
        for (const id of idsToExpand) {
          try { setCatalogOpen(id, true) } catch (e) { console.error('sbx: setCatalogOpen failed', e) }
        }
      }, [catalogs])

      const toggleExpand = (id, open) => {
        if (userTouchedRef.current === null) userTouchedRef.current = new Set()
        userTouchedRef.current.add(id)
        setExpanded(prev => ({ ...prev, [id]: open }))
        try { setCatalogOpen(id, open) } catch (e) { console.error('sbx: setCatalogOpen failed', e) }
      }

      // ---- Agent 树（直接子 + 可展开嵌套；行点击打开，chevron 展开分支）----
      // 框架 listChildren 按 header.createdAt 升序（最旧→最新），sidebar 不暴露该字段。
      // 不 mutate 原数组，逆序遍历显示「最新在最上」。
      const renderTree = (parentId, depth) => {
        const cat = catalogs[parentId]
        const rawEntries = cat && Array.isArray(cat.entries) ? cat.entries : []
        const entries = [...rawEntries].reverse()
        const out = []
        if (cat && cat.state !== 'error' && cat.state !== 'ready' && entries.length === 0) {
          out.push(React.createElement('div', { key: 'load-' + parentId, className: 'sbx-hint' }, '加载子代理…'))
          return out
        }
        for (const entry of entries) {
          if (!entry || entry.kind !== 'child') continue
          const running = entry.activity === 'running'
          const label = entry.label ?? entry.id
          const isOpen = !!expanded[entry.id]
          const kids = entry.hasChildren && isOpen ? renderTree(entry.id, depth + 1) : []
          const chevron = entry.hasChildren
            ? React.createElement('span', {
                key: 'chev' + entry.id,
                className: 'sbx-chev',
                onClick: (e) => { e.stopPropagation(); toggleExpand(entry.id, !isOpen) },
              }, isOpen ? '▾' : '▸')
            : null
          out.push(
            React.createElement('div', {
              key: entry.id,
              className: 'sbx-row',
              style: { paddingLeft: 6 + depth * 12 },
              onClick: () => {
                openSubagent({ parentSessionId: parentId, childSessionId: entry.id, mode: entry.mode })
              },
            },
              React.createElement('span', { className: running ? 'sbx-dot sbx-dot-run' : 'sbx-dot sbx-dot-done' }),
              React.createElement('span', { className: 'sbx-label' }, label),
              React.createElement('span', { className: 'sbx-meta' }, entry.mode === 'one-shot' ? '一次性' : '延续', running ? ' · 运行中' : ''),
              chevron,
            ),
          )
          for (const k of kids) out.push(k)
        }
        return out
      }

      // ---- 工具调用详情（自建版）：运行中置顶 + 最近 40 条 settled 降序 ----
      const runningList = []
      for (const call of runningCalls || []) {
        runningList.push({ callId: call.callId, name: call.name, argsRaw: call.argsRaw, running: true, isError: false, resultText: '' })
      }
      const settledMap = new Map()
      let callOrder = 0
      for (const node of nodes || []) {
        if (node.kind === 'assistant') {
          for (const b of node.blocks || []) {
            if (b.kind === 'tool-call') {
              const rec = { callId: b.callId, name: b.name, argsRaw: b.argsRaw, running: false, isError: false, resultText: '', order: callOrder++ }
              if (!settledMap.has(b.callId) && !runningList.some(r => r.callId === b.callId)) settledMap.set(b.callId, rec)
            }
          }
        } else if (node.kind === 'tool-result') {
          const rec = {
            callId: node.callId,
            name: node.call ? node.call.name : node.callId,
            argsRaw: node.call ? node.call.argsRaw : null,
            running: false,
            isError: !!node.isError,
            resultText: textOf(node.content),
            order: callOrder++,
          }
          settledMap.set(node.callId, rec)
        }
      }
      const settledList = [...settledMap.values()].sort((a, b) => a.order - b.order).slice(-40).reverse()
      const callRows = [...runningList, ...settledList]
      const [openCall, setOpenCall] = React.useState(null)

      const renderCall = (c, idx) => {
        const isOpen = openCall === c.callId
        const head = React.createElement('div', {
          key: 'head' + c.callId,
          className: 'sbx-call-head',
          onClick: () => { setOpenCall(isOpen ? null : c.callId) },
        },
          React.createElement('span', { className: c.running ? 'sbx-dot sbx-dot-run' : 'sbx-dot sbx-dot-done' }),
          React.createElement('span', { className: 'sbx-call-name' }, c.name),
          React.createElement('span', { className: 'sbx-call-co' }, c.running ? '运行中' : (c.isError ? '错误' : '完成')),
        )
        const body = isOpen
          ? React.createElement('div', { key: 'body' + c.callId, className: 'sbx-call-exp' },
              c.argsRaw !== null && c.argsRaw !== undefined && c.argsRaw !== ''
                ? React.createElement('div', null, '▸ 参数', React.createElement('div', null, pretty(c.argsRaw)))
                : null,
              c.resultText !== ''
                ? React.createElement('div', { key: 'res' + c.callId, className: c.isError ? 'sbx-call-err' : undefined },
                    c.isError ? '▸ 错误: ' : '▸ 结果: ', c.resultText)
                : null,
              (!c.running && c.argsRaw !== null && c.argsRaw !== '' && c.resultText === '')
                ? React.createElement('div', null, '（结果未注入窗口）')
                : null,
            )
          : null
        return React.createElement('div', { key: 'c' + idx + '-' + c.callId, className: 'sbx-call' }, head, body)
      }

      // ---- 组装 ----
      const tabsEls = [
        ['agents', 'Agent 列表'],
        ['todo', 'To-Do'],
        ['calls', '工具详情'],
      ].map(([id, label]) =>
        React.createElement('button', {
          key: id,
          type: 'button',
          className: id === tab ? 'sbx-tab sbx-tab-active' : 'sbx-tab',
          onClick: () => { setTab(id) },
        }, label),
      )
      const header = React.createElement('div', { className: 'sbx-tabs' }, tabsEls)

      let body = null
      if (tab === 'agents') {
        const rows = listRootId === undefined ? [] : renderTree(listRootId, 0)
        if (listRootId === undefined || rows.length === 0) {
          console.log('sbx: agents empty', {
            sessionId: sessionId,
            listRootId: listRootId,
            hasById: listRootId !== undefined && !!byId[listRootId],
            rootOrigin: listRootId !== undefined && byId[listRootId] ? byId[listRootId].origin : undefined,
            catState: listRootId !== undefined && catalogs[listRootId] ? catalogs[listRootId].state : undefined,
            catEntries: listRootId !== undefined && catalogs[listRootId] ? (Array.isArray(catalogs[listRootId].entries) ? catalogs[listRootId].entries.length : 'n/a') : undefined,
          })
        }
        body = rows.length === 0
          ? React.createElement('div', { className: 'sbx-empty' }, '主会话暂无子代理。')
          : rows
      } else if (tab === 'todo') {
        const todoList = todosProj || []
        body = todoList.length === 0
          ? React.createElement('div', { className: 'sbx-empty' }, '当前任务没有待办项。')
          : React.createElement('div', null,
              React.createElement('div', { className: 'sbx-progress' }, '共 ' + todoList.length + ' 项'),
              todoList.map(todoRow),
            )
      } else {
        body = callRows.length === 0
          ? React.createElement('div', { className: 'sbx-empty' }, '会话中暂无工具调用。')
          : callRows.map(renderCall)
      }

      return React.createElement('div', { className: 'sbx-host' },
        header,
        React.createElement('div', { className: 'sbx-body' }, body),
      )
    }

    // Toggle 按钮：根据最近祖先的 [data-details-collapsed] 属性决定状态——
// 属性存在=侧栏收起（按钮负责展开），属性不存在=侧栏展开（按钮负责收起）。
// title/icon/onClick 三者随状态翻转；MutationObserver 监听祖先树属性变化。
    function RestoreButton(props) {
      const { openDetails, closeDetails } = props
      const [collapsed, setCollapsed] = React.useState(false)
      const ref = React.useRef(null)
      React.useEffect(() => {
        const node = ref.current
        if (node === null) return undefined
        const sync = () => {
          const el = node.closest('[data-details-collapsed]')
          setCollapsed(el !== null && el !== undefined)
        }
        sync()
        // 监听整棵祖先树（含 documentElement）该属性的翻转
        const observer = new MutationObserver(sync)
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['data-details-collapsed'],
          subtree: true,
        })
        return () => observer.disconnect()
      }, [])
      const onClick = () => {
        try {
          if (collapsed) openDetails(); else closeDetails()
        } catch (e) { console.error('sbx: toggle failed', e) }
      }
      return React.createElement('div', {
        ref,
        className: 'sbx-restore',
        title: collapsed ? '展开右侧栏' : '收起侧边栏',
        onClick,
      }, collapsed ? '‹' : '›')
    }

    const dispose = slots.inject('details', () => slots.register({
      name: 'details',
      priority: -100,
      inject: () => ({
        openSubagent: (addr) => {
          try { sessions.openSubagent(addr) }
          catch (e) {
            try { sessions.open(addr.childSessionId) } catch (e2) {
              console.error('sbx: open subagent failed', e2)
            }
          }
        },
        setCatalogOpen: (id, open) => { sessions.setSubagentCatalogOpen(id, open) },
        openDetails: () => { try { layout.openDetails() } catch (e) { console.error('sbx: openDetails failed', e) } },
      }),
    }, SidebarPanel))
    ctx.on('dispose', dispose)

    const disposeRestore = slots.inject('shell.overlay', () => slots.register({
      name: 'shell.overlay',
      id: 'agent-sidebar-restore',
      // toggle 同时需要展开/收起两个动作：openDetails 清 userCollapsed，closeDetails 置 userCollapsed。
      inject: () => ({
        openDetails: () => { userCollapsed = false; try { layout.openDetails() } catch (e) { console.error('sbx: openDetails failed', e) } },
        closeDetails: () => { userCollapsed = true; try { layout.closeDetails() } catch (e) { console.error('sbx: closeDetails failed', e) } },
      }),
    }, RestoreButton))
    ctx.on('dispose', disposeRestore)
  }
  }
    return plugin
}

export default factory
