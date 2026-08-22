// RESIDENT PORT of scratch/current-plugins/subctl2-host.js (dynamic -> permanent browser half).
//
// MERGE NOTE (Phase 1.6, re-applied at v8 re-sync): wrapped as a CJS factory
// function (no `__ModuleLoader__.load`); the merged `lib/client.js` does the
// single load with the bundle id and requires this factory. R20 dedup guard
// re-applied to `styles.insert` (parity with composer).
function factory(require) {
    const React = require('react')

    // Local styles helper. The previous `slots.inject('subagent-controller-styles', ...)`
    // pattern never fired (that slot does not exist in the framework), so CSS was
    // never injected and the panel rendered unstyled. Inject directly here, in
    // apply()'s body, like dsh-agent-sidebar does.
    const styles = {
      insert(cssText) {
        if (typeof document === 'undefined') return
        const tagId = 'dsh-specify-subagent-suite/subctl-panel'
        if (document.querySelector('style[data-plugin-css="' + tagId + '"]') !== null) return
        const el = document.createElement('style')
        el.dataset.plugin = 'dsh-specify-subagent-suite'
        el.dataset.pluginCss = tagId
        el.textContent = cssText
        ;(document.head || document.documentElement).appendChild(el)
      },
    }

    const inject = ['slots', 'remote']

    function apply(ctx) {
      const slots = ctx.slots
      if (slots === undefined) return

      styles.insert(`
      .subctl-wrap { position: relative; display: inline-flex; align-items: center; }
      .subctl-button { display: inline-flex; align-items: center; gap: 6px; min-height: 28px; padding: 3px 2px; border: 0; border-radius: 6px; background: transparent; color: var(--dsw-alias-label-secondary, #b8b8b8); font-size: 12px; line-height: 18px; cursor: pointer; white-space: nowrap; }
      .subctl-button:hover, .subctl-button:focus-visible { color: var(--dsw-alias-label-primary, #f0f0f0); }
      .subctl-button:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary, var(--dsw-alias-label-secondary, #b8b8b8)); outline-offset: 2px; }
      .subctl-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--dsw-alias-state-success-primary, #4caf50); display: inline-block; flex: none; }
      .subctl-caret { flex: none; display: inline-flex; align-items: center; justify-content: center; color: inherit; transition: transform 120ms ease; }
      .subctl-caret svg { display: block; }
      .subctl-caret-open { transform: rotate(180deg); }
      .subctl-panel-backdrop { position: fixed; inset: 0; z-index: 1040; }
      /* 高度封顶 50vh（dvh 回退写法：支持动态视窗高度的浏览器用 dvh，移动端地址栏收展自适应）；
         宽度 clamp 流式（手机 ~92vw → 桌面 440px 封顶），适配平板/手机。 */
      .subctl-panel { position: absolute; top: calc(100% + 6px); left: 0; z-index: 1100; box-sizing: border-box; width: clamp(300px, 92vw, 440px); max-height: min(50vh, 720px); max-height: min(50dvh, 720px); padding: 10px 6px; display: flex; flex-direction: column; gap: 0; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.5)); border-radius: 12px; background: var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-layer-1, #2a2b2e)); box-shadow: 0 8px 28px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.3); overflow-x: hidden; overflow-y: auto; scrollbar-gutter: stable; color: var(--dsw-alias-label-primary, #f0f0f0); font-size: 12px; }
      .subctl-panel::-webkit-scrollbar { width: 8px; }
      .subctl-panel::-webkit-scrollbar-thumb { background: var(--dsw-alias-border-l2, rgba(128,128,128,0.4)); border-radius: 4px; }
      .subctl-panel::-webkit-scrollbar-thumb:hover { background: var(--dsw-alias-border-l2, rgba(128,128,128,0.65)); }
      .subctl-panel::-webkit-scrollbar-track { background: transparent; }
      .subctl-panel { scrollbar-width: thin; scrollbar-color: var(--dsw-alias-border-l2, rgba(128,128,128,0.4)) transparent; }
      .subctl-empty { padding: 10px; color: var(--dsw-alias-label-secondary, #999); font-size: 12px; }
      .subctl-row { display: flex; flex-direction: column; gap: 6px; padding: 8px 8px; border-radius: 8px; min-width: 0; max-width: 100%; box-sizing: border-box; }
      .subctl-row:not(:last-child) { border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.08)); padding-bottom: 10px; margin-bottom: 6px; }
      .subctl-row:hover { background: var(--dsw-alias-bg-layer-2, rgba(128,128,128,0.12)); }
      .subctl-row-head { display: flex; flex-direction: column; gap: 4px; min-width: 0; max-width: 100%; padding-right: 0; }
      .subctl-row-title { display: flex; align-items: center; gap: 7px; min-width: 0; max-width: 100%; }
      .subctl-name { font-weight: 600; color: var(--dsw-alias-label-primary, #f0f0f0); font-size: 13px; line-height: 20px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .subctl-tag { flex: none; padding: 0 6px; border-radius: 5px; background: var(--dsw-alias-bg-layer-1, rgba(128,128,128,0.2)); color: var(--dsw-alias-label-secondary, #b8b8b8); font-size: 11px; line-height: 18px; }
      .subctl-desc { color: var(--dsw-alias-label-secondary, #b8b8b8); font-size: 11px; line-height: 16px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; word-break: break-word; overflow-wrap: anywhere; min-width: 0; max-width: 100%; padding-right: 4px; }
      .subctl-selects { display: flex; gap: 12px; min-width: 0; max-width: 100%; width: 100%; box-sizing: border-box; }
      .subctl-select-model { position: relative; flex: 8 1 0; min-width: 0; }
      .subctl-select-effort { position: relative; flex: 5 1 0; min-width: 0; }
      .subctl-select-trigger { display: flex; align-items: center; justify-content: space-between; gap: 5px; width: 100%; max-width: 100%; min-height: 28px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-primary, #f0f0f0); background: var(--dsw-alias-bg-base, transparent); border: 1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.4)); border-radius: 6px; padding: 4px 9px; cursor: pointer; text-align: left; min-width: 0; box-sizing: border-box; }
      .subctl-select-trigger:hover { background: var(--dsw-alias-bg-layer-2, rgba(128,128,128,0.15)); }
      .subctl-select-trigger.disabled { opacity: 0.4; cursor: not-allowed; }
      .subctl-select-trigger .subctl-placeholder { color: var(--dsw-alias-label-secondary, #999); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
      .subctl-select-trigger .subctl-value { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
      .subctl-arrow { color: var(--dsw-alias-label-secondary, #999); font-size: 9px; flex: none; }
      .subctl-popup { position: fixed; z-index: 1200; box-sizing: border-box; padding: 2px; display: flex; flex-direction: column; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.5)); border-radius: 7px; background: var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-layer-1, #2a2b2e)); box-shadow: 0 8px 28px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.3); max-height: 320px; overflow-y: auto; }
      .subctl-opt { display: flex; align-items: center; min-height: 26px; padding: 3px 7px; border: none; border-radius: 5px; background: transparent; cursor: pointer; color: var(--dsw-alias-label-primary, #f0f0f0); font-size: 12px; line-height: 18px; text-align: left; white-space: nowrap; }
      .subctl-opt:hover { background: var(--dsw-alias-bg-layer-2, rgba(128,128,128,0.12)); }
      .subctl-opt.selected { font-weight: 600; background: var(--dsw-alias-bg-layer-2, rgba(128,128,128,0.18)); }
      .subctl-opt.empty-opt { color: var(--dsw-alias-label-secondary, #999); }
      .subctl-group-label { padding: 4px 7px; font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-secondary, #999); }
      .subctl-backdrop { position: fixed; inset: 0; z-index: 1100; }
      .subctl-error { color: var(--dsw-alias-state-error-primary, #ff7875); padding: 6px 4px; font-size: 12px; }
      .subctl-meta { color: var(--dsw-alias-label-secondary, #999); padding: 6px 4px; font-size: 12px; }
      .subctl-button.disabled { opacity: 0.4; cursor: not-allowed; }
      .subctl-scopebar { display: flex; align-items: center; gap: 6px; padding: 6px 6px 8px; flex: none; }
      .subctl-scope-btn { padding: 2px 9px; border-radius: 6px; border: 1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.4)); background: transparent; color: var(--dsw-alias-label-secondary, #b8b8b8); font-size: 11px; line-height: 18px; cursor: pointer; }
      .subctl-scope-btn.active { color: var(--dsw-alias-label-primary, #f0f0f0); background: var(--dsw-alias-bg-layer-2, rgba(128,128,128,0.18)); font-weight: 600; }
      .subctl-refresh { margin-left: auto; padding: 2px 7px; border-radius: 6px; border: 1px solid transparent; background: transparent; color: var(--dsw-alias-label-secondary, #999); font-size: 11px; line-height: 18px; cursor: pointer; min-width: 36px; box-sizing: border-box; text-align: center; }
      .subctl-refresh:hover { color: var(--dsw-alias-label-primary, #f0f0f0); }
      .subctl-refresh.busy { opacity: 0.6; cursor: progress; }
      .subctl-refresh-icon { display: inline-block; width: 12px; height: 12px; vertical-align: -2px; animation: subctl-spin 0.8s linear infinite; color: currentColor; }
      @media (prefers-reduced-motion: reduce) {
        .subctl-refresh-icon { animation: none; }
      }
      @keyframes subctl-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .subctl-layer-tag { flex: none; padding: 0 5px; border-radius: 4px; background: var(--dsw-alias-bg-layer-1, rgba(128,128,128,0.2)); color: var(--dsw-alias-label-secondary, #b8b8b8); font-size: 10px; line-height: 16px; }
      .subctl-broken { color: var(--dsw-alias-state-error-primary, #ff7875); font-size: 11px; line-height: 16px; padding: 2px 0; }
      .subctl-busy-note { margin: 2px 6px 6px; padding: 6px 8px; border-radius: 6px; border: 1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.4)); background: var(--dsw-alias-bg-layer-2, rgba(128,128,128,0.12)); color: var(--dsw-alias-label-secondary, #b8b8b8); font-size: 11px; line-height: 16px; }
    `)

      // Wire channel: direct same-origin POST to the route registered by the
      // dsh-subctl host half. The previous gateway path
      // (connection.rpc.call('/api', 'subagentTemplateControl/<wire>', …))
      // 404s in a live tsx process: the plugin and the api-gateway hold two
      // different copies of dsh-typert-protocol, so the gateway never saw the
      // plugin's Remote markers and claimed no endpoint. Same-origin fetch has
      // no module-identity dependency; wire names and envelopes unchanged.
      const call = (wire) => async (args) => {
        const response = await fetch('/subagent-controller/rpc', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ method: wire, args: args === undefined ? {} : args }),
        })
        if (!response.ok) {
          throw new Error('subctl RPC ' + wire + ' failed: HTTP ' + response.status)
        }
        const result = await response.json()
        if (result === null || typeof result !== 'object' || result.ok !== true) {
          const message = result !== null && typeof result === 'object' && typeof result.message === 'string'
            ? result.message
            : ''
          throw new Error(message || ('subctl RPC ' + wire + ' failed'))
        }
        return result.value
      }
      ctx.provide('remote.subagentTemplateControl', {
        listTemplates: call('list-templates'),
        listTemplateConfigs: call('list-template-configs'),
        getTemplateConfig: call('get-template-config'),
        applyTemplateConfig: call('apply-template-config'),
        listModels: call('list-models'),
        resolveEfforts: call('resolve-efforts'),
        getPanelState: call('get-panel-state'),
      })
      const remote = ctx.remote.subagentTemplateControl

      // B4: client no longer persists overrides to localStorage. Host owns
      // ~/.dsh/subctl/overrides.json and is the only writer.

      const ChevronDownIcon = React.createElement('svg', {
        width: 14,
        height: 14,
        viewBox: '0 0 14 14',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
      }, React.createElement('path', {
        d: 'M11.8486 5.5L11.4238 5.92383L8.69727 8.65137C8.44157 8.90706 8.21562 9.13382 8.01172 9.29785C7.79912 9.46883 7.55595 9.61756 7.25 9.66602C7.08435 9.69222 6.91565 9.69222 6.75 9.66602C6.44405 9.61756 6.20088 9.46883 5.98828 9.29785C5.78438 9.13382 5.55843 8.90706 5.30273 8.65137L2.57617 5.92383L2.15137 5.5L3 4.65137L3.42383 5.07617L6.15137 7.80273C6.42595 8.07732 6.59876 8.24849 6.74023 8.3623C6.87291 8.46904 6.92272 8.47813 6.9375 8.48047C6.97895 8.48703 7.02105 8.48703 7.0625 8.48047C7.07728 8.47813 7.12709 8.46904 7.25977 8.3623C7.40124 8.24849 7.57405 8.07732 7.84863 7.80273L10.5762 5.07617L11 4.65137L11.8486 5.5Z',
        fill: 'currentColor',
      }))

      const Caret = (props) => React.createElement('span', {
        className: 'subctl-caret' + (props.open ? ' subctl-caret-open' : ''),
      }, ChevronDownIcon)

      function MiniSelect(props) {
        const { value, placeholder, groups, onChange, disabled, disabledReason, widthClass, closeSignal } = props
        const [open, setOpen] = React.useState(false)
        const [rect, setRect] = React.useState(null)
        const selectedLabel = React.useMemo(() => {
          if (value === '' || value === undefined || value === null) return null
          let found = null
          for (const group of groups || []) {
            for (const option of group.options || []) {
              if (option.value === value) found = option.label
            }
          }
          return found
        }, [value, groups])

        // F6: 父层通过 closeSignal=true 强行关闭已开的弹层（refresh 期间旧值将失效）。
        React.useEffect(() => {
          if (closeSignal === true && open) setOpen(false)
        }, [closeSignal])

        if (disabled) {
          return React.createElement('div', { className: widthClass || 'subctl-select-model' },
            React.createElement('div', {
              className: 'subctl-select-trigger disabled',
              title: typeof disabledReason === 'string' && disabledReason !== '' ? disabledReason : undefined,
            },
              selectedLabel === null
                ? React.createElement('span', { className: 'subctl-placeholder' }, placeholder)
                : React.createElement('span', { className: 'subctl-value' }, selectedLabel),
            ),
          )
        }

        const openAt = (event) => {
          const node = event.currentTarget
          if (node && typeof node.getBoundingClientRect === 'function') {
            setRect(node.getBoundingClientRect())
          }
          setOpen(true)
        }

        const optionViews = (groups || []).map((group) => {
          const header = group.label
            ? React.createElement('div', { key: 'h:' + group.label, className: 'subctl-group-label' }, group.label)
            : null
          const options = (group.options || []).map((option) => {
            const isSelected = option.value === value
            return React.createElement('div', {
              key: option.value,
              className: 'subctl-opt' + (isSelected ? ' selected' : '') + (option.value === '' ? ' empty-opt' : ''),
              onClick: () => { onChange(option.value); setOpen(false) },
            }, option.label)
          })
          return [header, options]
        })

        const popupStyle = rect === null ? { left: 0, top: 0, visibility: 'hidden' } : {
          left: Math.max(8, Math.min(rect.left, window.innerWidth - 300)) + 'px',
          top: Math.min(rect.bottom + 3, window.innerHeight - 40) + 'px',
          minWidth: '280px',
          maxWidth: '460px',
        }

        return React.createElement('div', { className: widthClass || 'subctl-select-model' },
          open ? React.createElement('div', { className: 'subctl-backdrop', onClick: () => setOpen(false) }) : null,
          React.createElement('div', {
            className: 'subctl-select-trigger',
            onClick: (event) => { if (open) setOpen(false); else openAt(event) },
          },
            selectedLabel === null
              ? React.createElement('span', { className: 'subctl-placeholder' }, placeholder)
              : React.createElement('span', { className: 'subctl-value' }, selectedLabel),
            React.createElement('span', { className: 'subctl-arrow' }, open ? '\u25B2' : '\u25BC'),
          ),
          open && rect !== null ? React.createElement('div', { className: 'subctl-popup', style: popupStyle }, optionViews) : null,
        )
      }

      function TemplateController(props) {
        // 当前会话的 preset id 与 origin：经 slot runtime 注入的 sessions store 读取
        // （镜像 dsh-agent-presets/lib/client.js:78-96 的 PresetChip 模式）。
        // 分支依赖的 props.useSessions 由 slot runtime 每次注册只注入一次、
        // 类型恒为 function，因此对同一挂载实例 hook 数量不会跨渲染翻转。
        const propSessionId = props !== undefined && typeof props.sessionId === 'string' ? props.sessionId : ''
        const useSessionsFn = props !== undefined && typeof props.useSessions === 'function' ? props.useSessions : null
        // 当前 Chat Tab 会话行；空 id / 未加载时为 undefined（selector 内消化，
        // hook 无条件调用，恒定性不依赖 slot remount 前提）。
        const readSessionRow = () => {
          try {
            return useSessionsFn !== null
              ? useSessionsFn((s) => (propSessionId !== '' && s !== null && typeof s === 'object' && s.byId && s.byId[propSessionId] ? s.byId[propSessionId] : undefined))
              : undefined
          } catch (err) {
            console.error('subctl: useSessions read failed', err)
            return undefined
          }
        }
        const sessionRow = readSessionRow()
        const presetRaw = sessionRow !== undefined && typeof sessionRow.agentPreset === 'string' ? sessionRow.agentPreset : undefined
        const currentPreset = typeof presetRaw === 'string' ? presetRaw : ''
        const isSubagentView = sessionRow !== undefined && sessionRow.origin === 'subagent'
        // Chat Tab 会话门控（蓝图 2.5）：origin==='subagent' 标记子代理及
        // 更深层级（每层派发都写该标）；此时面板无效化。summary 未加载
        // （sessionRow undefined）时按主会话处理——宁可短暂可用也不永久误禁。

        const [open, setOpen] = React.useState(false)
        const [scope, setScope] = React.useState('global')
        const [data, setData] = React.useState(null)
        const [efforts, setEfforts] = React.useState({})
        // B9-F1: efforts 查询去重镜像（modelKey -> 已查询），避免 refresh 重复 RPC。
        const effortsRef = React.useRef({})
        const [busy, setBusy] = React.useState(false)
        const [error, setError] = React.useState(null)
        // v2.0.0 F7/N5：面板所属会话忙态（主 turn 在途或有子 agent 在途）。
        // 忙时全部编辑控件禁用 + 置顶提示；空闲后自动解禁（无积压写）。
        const [sessionBusy, setSessionBusy] = React.useState(false)
        // F7: 请求 epoch 守卫。refresh() 开头自增；setData/setError 前比对
        // epochRef.current，旧的（remount 后或被并发点击覆盖的）写回被丢弃。
        // 并发点击共享同一单调递增计数器——只有最后一轮写回落地。
        const epochRef = React.useRef(0)

        const refresh = React.useCallback(async () => {
          const myEpoch = ++epochRef.current
          setBusy(true)
          setError(null)
          try {
            const [templates, models, configs] = await Promise.all([
              remote.listTemplates(),
              remote.listModels(),
              remote.listTemplateConfigs(),
            ])
            // host 返回双层结构 { global: {…}, sessions: {…} }（蓝图 2.2）。
            const hostConfigs = configs && typeof configs === 'object' && configs.global && typeof configs.global === 'object'
              ? configs
              : { global: configs && typeof configs === 'object' ? configs : {}, sessions: {} }
            const tpls = Array.isArray(templates) ? templates : []
            // session-scoped slot remounts clear component-local efforts;
            // B9-F1/F3: efforts 按 modelKey(provider/model) 键控，不按 template.id。
            // 解析范围 = 当前显示作用域的生效配置（会话模式取会话层优先），
            // 键与渲染读取一致，模型切换后档位不再跨模型串用。
            // 同实例内 scope/模板集变化时旧键累积；只读缓存不含会话数据，
            // 故不按会话清洗（session-scoped 覆盖改变的是 configs 层）。
            const sessionLayer = hostConfigs.sessions && typeof hostConfigs.sessions === 'object' && propSessionId !== ''
              ? hostConfigs.sessions[propSessionId]
              : undefined
            const effCfg = (t) => scope === 'session'
              ? (sessionLayer && sessionLayer[t.id]) || hostConfigs.global[t.id]
              : hostConfigs.global[t.id]
            for (const t of tpls) {
              const cfg = effCfg(t)
              if (cfg && typeof cfg.provider === 'string' && cfg.provider !== ''
                && typeof cfg.model === 'string' && cfg.model !== '') {
                const modelKey = cfg.provider + '/' + cfg.model
                if (effortsRef.current[modelKey] !== undefined) continue
                remote.resolveEfforts({ provider: cfg.provider, model: cfg.model })
                  .then((res) => {
                    effortsRef.current[modelKey] = true
                    setEfforts((prev) => ({ ...prev, [modelKey]: res }))
                  })
                  .catch(() => {})
              }
            }
            if (epochRef.current !== myEpoch) return
            setData({
              templates: tpls,
              models: Array.isArray(models) ? models : [],
              configs: hostConfigs,
            })
            // v2.0.0 F7：list-template-configs 附带的 busySessions 供忙态初始渲染
            // （后续以 get-panel-state 轮询为准）。
            if (propSessionId !== '' && hostConfigs.busySessions && typeof hostConfigs.busySessions === 'object') {
              setSessionBusy(hostConfigs.busySessions[propSessionId] === true)
            }
          } catch (err) {
            if (epochRef.current !== myEpoch) return
            setError(String(err && err.message ? err.message : err))
          } finally {
            if (epochRef.current === myEpoch) setBusy(false)
          }
        // propSessionId / scope 变化时重建：避免闭包捕获过期会话 id 或过期作用域。
        }, [propSessionId, scope])

        React.useEffect(() => {
          if (open) refresh()
        }, [open, refresh])

        // v2.0.0 F7/N5：面板打开期间 ~1s 轮询会话忙态；busy 时禁用编辑、空闲自动解禁。
        React.useEffect(() => {
          if (!open || propSessionId === '') return undefined
          let cancelled = false
          const poll = async () => {
            try {
              const st = await remote.getPanelState({ editorSessionId: propSessionId })
              if (!cancelled && st !== null && typeof st === 'object') setSessionBusy(st.busy === true)
            } catch { /* 查询失败保持现态，下一轮重试 */ }
          }
          poll()
          const h = setInterval(poll, 1000)
          return () => { cancelled = true; clearInterval(h) }
        }, [open, propSessionId])

        // Chat Tab 会话门控（蓝图 2.5）：子代理/更深层级执行流中面板无效化。
        // 门控只影响 createElement 分支选择；所有 hook 已在上方无条件调用。
        if (isSubagentView) {
          return React.createElement('div', { className: 'subctl-wrap' },
            React.createElement('button', {
              className: 'subctl-button disabled',
              disabled: true,
              title: '\u5B50Agent\u6A21\u677F\u4EC5\u5728\u4E3B\u4F1A\u8BDD\u4E2D\u53EF\u7528\uFF1B\u5F53\u524D\u9875\u9762\u662F\u5B50 Agent \u6267\u884C\u6D41\u3002',
            },
              React.createElement('span', { className: 'subctl-dot' }),
              React.createElement('span', null, '\u5B50Agent\u6A21\u677F'),
              React.createElement(Caret, { open: false }),
            ),
          )
        }

        if (!open) {
          return React.createElement('div', { className: 'subctl-wrap' },
            React.createElement('button', { className: 'subctl-button', onClick: () => setOpen(true) },
              React.createElement('span', { className: 'subctl-dot' }),
              React.createElement('span', null, '\u5B50Agent\u6A21\u677F'),
              React.createElement(Caret, { open: false }),
            ),
          )
        }

        // 当前作用域（蓝图 2.4）：'session' 读会话层（无则回落显示全局层值并标注层级）。
        const sessionLayer = data !== null && data.configs.sessions && typeof data.configs.sessions === 'object'
          && propSessionId !== '' ? data.configs.sessions[propSessionId] : undefined
        const templateConfig = (id) => {
          if (data === null) return {}
          if (scope === 'session' && sessionLayer && sessionLayer[id]) return sessionLayer[id]
          if (data.configs.global && data.configs.global[id]) return data.configs.global[id]
          return {}
        }
        const layerOfTemplate = (id) => (
          scope === 'session' && sessionLayer && sessionLayer[id] ? 'session' : 'global'
        )
        const scopeArgs = scope === 'session'
          ? { scope: 'session', sessionId: propSessionId }
          : { scope: 'global' }

        const setLocalConfig = (templateId, patch) => {
          setData((prev) => {
            if (prev === null) return prev
            // 本地乐观更新按当前作用域写入对应层；会话层缺失时 base 为空
            // 对象——不把全局层并入新会话层（host 语义：会话层只含本会话
            // 显式配置过的字段，清 session 只清这些字段）。
            const layer = scope === 'session' && prev.configs.sessions && prev.configs.sessions[propSessionId]
              ? prev.configs.sessions[propSessionId]
              : (scope === 'session' ? {} : prev.configs.global)
            const current = (layer && layer[templateId]) || {}
            const merged = { ...current, ...patch }
            const clean = {}
            if (merged.provider !== undefined && merged.provider !== '') clean.provider = merged.provider
            if (merged.model !== undefined && merged.model !== '') clean.model = merged.model
            if (merged.effort !== undefined && merged.effort !== '') clean.effort = merged.effort
            if (scope === 'session') {
              const sessions = { ...prev.configs.sessions, [propSessionId]: { ...layer, [templateId]: clean } }
              return { ...prev, configs: { ...prev.configs, sessions } }
            }
            return { ...prev, configs: { ...prev.configs, global: { ...prev.configs.global, [templateId]: clean } } }
          })
        }

        const changeModel = (template, value) => {
          if (sessionBusy || value === '') return
          const slash = value.indexOf('/')
          if (slash === -1) return
          const provider = value.slice(0, slash)
          const model = value.slice(slash + 1)
          // B9-F2: 切换模型即清空既有 effort（旧档位对新模型可能非法），
          // 回落到"继承默认"；host 侧 effort:'' 语义为删除该字段。
          setLocalConfig(template.id, { provider, model, effort: '' })
          remote.applyTemplateConfig({ ...scopeArgs, editorSessionId: propSessionId, presetId: template.id, provider, model, effort: '' })
            .then((res) => {
              if (res && res.ok === false && res.message) setError(res.message)
            })
            .catch((err) => setError(String(err && err.message ? err.message : err)))
          const modelKey = provider + '/' + model
          if (effortsRef.current[modelKey] !== undefined) return
          remote.resolveEfforts({ provider, model })
            .then((res) => {
              effortsRef.current[modelKey] = true
              setEfforts((prev) => ({ ...prev, [modelKey]: res }))
            })
            .catch((err) => {
              setEfforts((prev) => ({ ...prev, [modelKey]: { efforts: [], defaultEffort: undefined } }))
              setError('\u89E3\u6790\u5F3A\u5EA6\u6863\u4F4D\u5931\u8D25: ' + String(err && err.message ? err.message : err))
            })
        }

        const changeEffort = (template, value) => {
          if (sessionBusy) return
          setLocalConfig(template.id, { effort: value })
          remote.applyTemplateConfig({ ...scopeArgs, editorSessionId: propSessionId, presetId: template.id, effort: value })
            .then((res) => {
              if (res && res.ok === false && res.message) setError(res.message)
            })
            .catch((err) => setError(String(err && err.message ? err.message : err)))
        }

        // B6: 清除该模板在当前作用域的整条覆盖（会话层清除后回落全局层）。
        const clearOverride = (template) => {
          if (busy || sessionBusy) return
          setBusy(true)
          setError(null)
          remote.applyTemplateConfig({ ...scopeArgs, editorSessionId: propSessionId, presetId: template.id, clear: true })
            .then((res) => {
              // F-C 修复（复审）：clear 与 set 同样消费 value 级业务拒绝（busy 竞态窗口 / 跨层拒绝）
              if (res && res.ok === false && res.message) setError(res.message)
              return refresh()
            })
            .catch((err) => {
              setError(String(err && err.message ? err.message : err))
              setBusy(false)
            })
        }

        const templates = data !== null ? (data.templates || []) : []
        const rowViews = templates.map((template) => {
          const config = templateConfig(template.id)
          const currentModel = config.provider && config.model
            ? config.provider + '/' + config.model
            : ''
          // 当前会话的 preset 仅显示提示；host 端只对子 Agent 生效，
          // 因此 UI 不应阻止编辑模板配置。
          const isLocked = currentPreset !== '' && template.id === currentPreset
          const lockReason = isLocked
            ? '当前会话正在使用该模板对应的 preset（' + currentPreset + '）。模板覆盖只影响以此 preset 派发的子 Agent，不影响本会话。'
            : undefined
          const effortInfo = efforts[config.provider && config.model ? config.provider + '/' + config.model : '']
          const modelGroups = busy ? [] : (data !== null ? (data.models || []) : []).map((providerEntry) => ({
            label: providerEntry.name || providerEntry.provider,
            options: (providerEntry.models || []).map((m) => ({
              value: providerEntry.provider + '/' + m.id,
              label: (m.name || m.id) + ' (' + providerEntry.provider + ')',
            })),
          }))
          const effortGroups = busy ? [{
            label: null,
            options: [{ value: '', label: '\u2014 \u9ED8\u8BA4\u5F3A\u5EA6 \u2014' }],
          }] : [{
            label: null,
            options: [
              { value: '', label: '\u2014 \u9ED8\u8BA4\u5F3A\u5EA6 \u2014' },
              ...(effortInfo ? effortInfo.efforts : []).map((entry) => ({ value: entry.id, label: entry.name || entry.id })),
            ],
          }]
          const desc = template.description || ''
          // roster broken 诊断（蓝图 2.7）：坏 composition 的 preset 禁用配置行。
          const isBroken = typeof template.broken === 'string' && template.broken !== ''
          const rowDisabled = isBroken
          const rowDisabledReason = isBroken ? '该模板的 composition 已损坏，无法挂载：' + template.broken : undefined
          const layer = layerOfTemplate(template.id)
          const hasValue = currentModel !== '' || (config.effort || '') !== ''
          return React.createElement('div', { key: template.id, className: 'subctl-row' },
            React.createElement('div', { className: 'subctl-row-head' },
              React.createElement('div', { className: 'subctl-row-title' },
                React.createElement('span', { className: 'subctl-name' }, template.name || template.id),
                template.trust ? React.createElement('span', { className: 'subctl-tag' }, template.trust) : null,
                hasValue && scope === 'session' ? React.createElement('span', { className: 'subctl-layer-tag' }, layer === 'session' ? '本会话' : '全局回落') : null,
                isLocked ? React.createElement('span', { className: 'subctl-tag', title: lockReason }, '当前会话') : null,
              ),
              desc ? React.createElement('div', { className: 'subctl-desc' }, desc) : null,
              isBroken ? React.createElement('div', { className: 'subctl-broken' }, template.broken) : null,
            ),
            React.createElement('div', { className: 'subctl-selects' },
              React.createElement(MiniSelect, {
                value: currentModel,
                placeholder: '\u2014 \u7EE7\u627F\u9ED8\u8BA4\u6A21\u578B \u2014',
                groups: modelGroups,
                disabled: rowDisabled || busy || sessionBusy,
                disabledReason: sessionBusy
                  ? '\u4F1A\u8BDD\u6267\u884C\u4E2D\uFF08\u4E3B agent \u6216\u5B50 agent \u5728\u9014\uFF09\uFF0C\u5B50Agent\u6A21\u677F\u5DF2\u65E0\u6548\u5316\uFF1B\u6267\u884C\u5B8C\u6BD5\u540E\u81EA\u52A8\u6062\u590D\u3002'
                  : (rowDisabledReason !== undefined
                    ? rowDisabledReason
                    : (busy ? '\u6A21\u578B\u5217\u8868\u5237\u65B0\u4E2D\u2026' : undefined)),
                closeSignal: busy || sessionBusy,
                onChange: (value) => changeModel(template, value),
                widthClass: 'subctl-select-model',
              }),
              React.createElement(MiniSelect, {
                value: config.effort || '',
                placeholder: '\u2014 \u9ED8\u8BA4\u5F3A\u5EA6 \u2014',
                groups: effortGroups,
                disabled: rowDisabled || currentModel === '' || busy || sessionBusy,
                disabledReason: sessionBusy
                  ? '\u4F1A\u8BDD\u6267\u884C\u4E2D\uFF08\u4E3B agent \u6216\u5B50 agent \u5728\u9014\uFF09\uFF0C\u5B50Agent\u6A21\u677F\u5DF2\u65E0\u6548\u5316\uFF1B\u6267\u884C\u5B8C\u6BD5\u540E\u81EA\u52A8\u6062\u590D\u3002'
                  : (rowDisabledReason !== undefined
                    ? rowDisabledReason
                    : (busy
                      ? '\u6A21\u578B\u5217\u8868\u5237\u65B0\u4E2D\u2026'
                      : (isLocked ? lockReason : undefined))),
                closeSignal: busy || sessionBusy,
                onChange: (value) => changeEffort(template, value),
                widthClass: 'subctl-select-effort',
              }),
            ),
            hasValue && scope === 'session' && layer === 'session'
              ? React.createElement('div', { className: 'subctl-selects' },
                  React.createElement('button', {
                    className: 'subctl-refresh' + (busy || sessionBusy ? ' busy' : ''),
                    disabled: busy || sessionBusy,
                    'aria-busy': busy || sessionBusy,
                    onClick: () => clearOverride(template),
                  }, '× \u6E05\u9664\u672C\u4F1A\u8BDD\u8986\u76D6'),
                )
              : null,
          )
        })

        return React.createElement('div', { className: 'subctl-wrap' },
          React.createElement('div', { className: 'subctl-panel-backdrop', onClick: () => setOpen(false) }),
          React.createElement('button', { className: 'subctl-button', onClick: () => setOpen(false) },
            React.createElement('span', { className: 'subctl-dot' }),
            React.createElement('span', null, '\u5B50Agent\u6A21\u677F'),
            React.createElement(Caret, { open: true }),
          ),
          React.createElement('div', { className: 'subctl-panel' },
            React.createElement('div', { className: 'subctl-scopebar' },
              // Q1 修复：忙态（含会话忙）下 scope 切换与刷新一并禁用——与下拉/清除控件统一
              // （refresh/scope 切换本身纯只读，此处为 UI 一致性，非写侧门控需求）。
              React.createElement('button', {
                className: 'subctl-scope-btn' + (scope === 'global' ? ' active' : ''),
                disabled: sessionBusy,
                title: sessionBusy ? '会话执行中，子Agent模板已无效化' : undefined,
                onClick: () => setScope('global'),
              }, '全局默认'),
              React.createElement('button', {
                className: 'subctl-scope-btn' + (scope === 'session' ? ' active' : ''),
                disabled: propSessionId === '' || sessionBusy,
                title: propSessionId === '' ? '无当前会话 id，无法使用会话级配置' : (sessionBusy ? '会话执行中，子Agent模板已无效化' : '仅影响当前会话派发的子 Agent'),
                onClick: () => setScope('session'),
              }, '仅本会话'),
              React.createElement('button', {
                className: 'subctl-refresh' + (busy || sessionBusy ? ' busy' : ''),
                disabled: busy || sessionBusy,
                'aria-busy': busy || sessionBusy,
                title: busy ? '\u5237\u65B0\u4E2D' : (sessionBusy ? '\u4F1A\u8BDD\u6267\u884C\u4E2D\uFF0C\u5B50Agent\u6A21\u677F\u5DF2\u65E0\u6548\u5316' : '\u91CD\u65B0\u52A0\u8F7D\u5217\u8868\u4E0E\u6A21\u578B'),
                onClick: () => refresh(),
              }, busy
                ? React.createElement('svg', {
                    className: 'subctl-refresh-icon',
                    role: 'img',
                    'aria-label': '\u5237\u65B0\u4E2D',
                    viewBox: '0 0 12 12',
                    fill: 'none',
                    xmlns: 'http://www.w3.org/2000/svg',
                  }, React.createElement('path', {
                    d: 'M6 1a5 5 0 0 1 5 5h-1.5a3.5 3.5 0 0 0-3.5-3.5V1zM6 11a5 5 0 0 1-5-5h1.5a3.5 3.5 0 0 0 3.5 3.5V11z',
                    fill: 'currentColor',
                  }))
                : '\u5237\u65B0'),
            ),
            sessionBusy
              ? React.createElement('div', { className: 'subctl-busy-note' },
                  '\u4F1A\u8BDD\u6267\u884C\u4E2D\uFF08\u4E3B agent \u6216\u5B50 agent \u5728\u9014\uFF09\uFF0C\u5B50Agent\u6A21\u677F\u5DF2\u65E0\u6548\u5316\uFF1B\u6267\u884C\u5B8C\u6BD5\u540E\u81EA\u52A8\u6062\u590D\u3002')
              : null,
            error !== null
              ? React.createElement('div', { className: 'subctl-error' }, error)
              : null,
            busy && data === null
              ? React.createElement('div', { className: 'subctl-meta' }, '\u52A0\u8F7D\u4E2D\u2026')
              : null,
            data !== null && templates.length === 0 && !busy && error === null
              ? React.createElement('div', { className: 'subctl-empty' }, '\u6682\u65E0\u81EA\u5B9A\u4E49\u5B50 Agent \u6A21\u677F')
              : null,
            rowViews,
          ),
        )
      }

      slots.inject('conversation.session.header.actions', () => slots.register(
        { name: 'conversation.session.header.actions', id: 'subagent-controller', order: 26, label: '\u5B50Agent\u6A21\u677F' },
        (props) => React.createElement(TemplateController, props),
      ))
    }

    return { inject, apply }
}

if (typeof module !== 'undefined' && module.exports) module.exports = factory
export default factory
