/**
 * One-shot subagent read-only composer badge: shadows the stock read-only
 * banner for one-shot subagent records (chain slot 'conversation.composer',
 * priority -20 — the stock ui-subagent takeover sits at -10, so this
 * entry's selector is elected first) and appends one line of real runtime
 * request provenance: provider/model · reasoningEffort of the latest
 * trajectory request. Reads the live conversation snapshot through the
 * standard useSession hook — zero RPC for the trajectory view; the
 * agent-preset id read from `state.byId[sessionId]?.agentPreset` is
 * localized through a one-shot `remote.agentPresets.list` cache kept in
 * module scope and re-read whenever the connection resets, so the badge
 * shows the preset's display name (`高精度审查模式`) instead of its
 * machine id (`high-precision`).
 *
 * Data chain: useSession(snapshot) -> snapshot.views.get('trajectory') ->
 * the LAST purpose === 'assistant' request's .requestConfig
 * (AssistantRequestConfig: provider, model, reasoningEffort?, …). Compaction
 * requests never carry reasoningEffort and would show the wrong provenance,
 * so they are skipped when locating the final generative request. Missing
 * view/request/config simply hides the line — the banner keeps the exact
 * stock copy and styling.
 */
import { useSyncExternalStore } from 'react'
import type { CSSProperties } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ComposerChainProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import css from './ComposerModelBadge.module.css'
import { presetTone, presetToneStyle } from './preset-tone'

/** Dictionary namespace owned by this plugin. */
const NS = 'composerModelBadge'

/** Simplified Chinese dictionary (the key-set source of truth). */
const zh = {
  'readonly.oneShot.title': '一次性子代理记录',
  'readonly.oneShot.body': '一次性任务不支持后续消息，可在这里查看完整执行记录。',
} as const

/** English dictionary, key-identical to the Chinese source of truth. */
const en: Record<ComposerModelBadgeKey, string> = {
  'readonly.oneShot.title': 'One-shot subagent record',
  'readonly.oneShot.body': 'One-shot tasks do not accept follow-ups; review the full execution record here.',
}

/** Key domain of the composerModelBadge namespace (zh is the source of truth). */
type ComposerModelBadgeKey = keyof typeof zh

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** One-shot read-only composer badge copy. */
    'composerModelBadge': ComposerModelBadgeKey
  }
}

/** Why this entry elects the composer: one-shot subagent record. */
export interface ComposerModelBadgeMatch {
  reason: 'one-shot'
}

/** Full chain props after this entry's selector accepts the owner currency. */
export type ComposerModelBadgeProps =
  PropsRuntime<'conversation.composer'> & { matched: ComposerModelBadgeMatch } & PropsLocale<typeof NS>

/**
 * Chain selector: elect this entry exactly when the owner session is a
 * one-shot subagent record. Pure over owner props (see ChainSelect);
 * everything else passes through to the stock composer entries.
 * @param owner - composer chain currency dispatched by the conversation root.
 * @returns the match, or null to decline.
 */
export function selectModelBadge(owner: ComposerChainProps): ComposerModelBadgeMatch | null {
  const subagent = owner.session?.subagent
  if (subagent === null || subagent === undefined) return null
  return subagent.address.mode === 'one-shot' ? { reason: 'one-shot' } : null
}

/**
 * Module-scope preset display-name cache.
 *
 * One `agentPresets.list` reply maps every preset id to its display name
 * (the `name` field from each preset's `preset.yml` — DSH ships four
 * shipped presets whose names come from a locale table rather than the
 * file, but those ids are all in {standard,code,minimal,cordis} and never
 * become subagent compositions in practice). The render side reads this
 * snapshot through `useSyncExternalStore` so a re-fetch after a connection
 * reset re-renders every open badge in one pass.
 *
 * `Record<string, string>` rather than `Map` so React's `useSyncExternalStore`
 * can hand it straight to its `getSnapshot` (must return a stable reference
 * when nothing changed; we keep the SAME object until a fetch lands).
 */
let presetDisplayById: Readonly<Record<string, string>> = Object.freeze({})
const presetListeners = new Set<() => void>()
const subscribe = (listener: () => void): (() => void) => {
  presetListeners.add(listener)
  return () => { presetListeners.delete(listener) }
}
const getSnapshot = (): Readonly<Record<string, string>> => presetDisplayById

/**
 * Read-only composer badge: the stock one-shot banner (same copy, same
 * styling) plus a live runtime provenance line when the trajectory carries a
 * final request config. The runtime line is prefixed with the session's
 * runtime Agent Preset (the template this subagent was dispatched under —
 * e.g. "梁神模式") so the user can tell at a glance which preset produced
 * the recorded model+effort. The preset chip shows the published display
 * name when the roster has loaded it, falling back to the raw id until the
 * fetch lands (or forever, for a preset the host never publishes — same as
 * the stock `AgentPresetLabel` chip).
 * @param props - selector-owned match plus standard slot props (t, useSession, useSessions).
 * @returns the composer replacement.
 */
export function ComposerModelBadge({
  t, useSession, useSessions,
}: ComposerModelBadgeProps) {
  // Stable reference per publication: views.get returns the cached snapshot.
  // Locate the LAST ordinary generative request (purpose 'assistant') — the
  // requests list is startSeq-ascending and may end with compaction requests
  // that carry no reasoningEffort and would misreport provenance.
  const requestConfig = useSession(snapshot => {
    const requests = snapshot.views.get('trajectory')?.requests
    if (requests === undefined) return undefined
    for (let index = requests.length - 1; index >= 0; index--) {
      const request = requests[index]
      if (request !== undefined && request.requestConfig !== undefined
        && request.purpose === 'assistant') {
        return request.requestConfig
      }
    }
    return undefined
  })
  // Pull the runtime preset this subagent session was mounted from (the
  // SessionSummary projected into the sessions.byId map by the host). Absent
  // for sessions composed without a preset — we then simply skip the prefix.
  const sessionId = useSession(snapshot => snapshot.sessionId)
  const preset = useSessions(state => state.byId[sessionId]?.agentPreset)
  // Localize the id through the cache populated by `apply()` below. Subscribe
  // so a late-landing roster fetch (or a connection reset that re-fetches)
  // re-renders this badge.
  const presetRoster = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const meta = requestConfig === undefined
    ? undefined
    : requestConfig.provider + '/' + requestConfig.model + (requestConfig.reasoningEffort ? ' · ' + requestConfig.reasoningEffort : '')
  const showPreset = preset !== undefined && preset !== ''
  // Prefer the published display name; fall back to the raw id until the
  // roster lands (or forever, if the host never publishes one).
  const presetLabel = showPreset ? (presetRoster[preset] ?? preset) : undefined
  return (
    <div className={css.frame} role="status">
      <div className={css.line}>
        <strong>{t('readonly.oneShot.title')}</strong>
        <span>{t('readonly.oneShot.body')}</span>
      </div>
      {(meta !== undefined || showPreset) && (
        <div className={css.line}>
          {showPreset && (
            // Tone derives the chip's background+foreground from the preset id
            // so a glance at the banner tells which preset the recorded
            // subagent ran under. The CSS module picks the matching variant
            // under `@media (prefers-color-scheme: dark)`.
            <span
              className={css.preset}
              style={presetToneStyle(presetTone(preset)) as CSSProperties}
              title="Agent Preset (会话模板)"
            >
              {presetLabel}
            </span>
          )}
          {meta !== undefined && (
            <span className={css.meta}>{meta}</span>
          )}
        </div>
      )}
    </div>
  )
}

/** Required services for the composer slot and its dictionary. */
export const inject = ['slots', 'locale', 'connection', 'remote', 'remote.agentPresets']

/**
 * Pull the agent-preset roster once and populate the module-scope
 * `presetDisplayById` cache. Re-runs on every `connection/reset` so a new
 * connection generation refreshes the map (a preset authored between
 * generations is then visible to badges mounted before the reset, but those
 * badges already rendered their stale id and will re-render on the next
 * `useSyncExternalStore` notify).
 *
 * The roster is fetched AFTER mount rather than awaited inside `apply()`:
 * the composer chain must register synchronously to win priority -20, and a
 * late-landing roster is harmless because the chip falls back to the raw
 * id until the cache fills.
 */
function refreshPresetRoster(ctx: ClientContext): void {
  // 0.1.2 迁移：ApiProxy 包删除后 `connection.api` 不复存在，agent-preset
  // 名册改由 remote 命名空间直达（对齐 ui-agent-preset settings-store 的
  // `remote.agentPresets.list()` 调用形状）。守卫而非注入依赖：名册只影响
  // 徽章的显示名回退，拿不到时静默保留机器 id。
  const rosterApi = ctx.remote.agentPresets
  if (rosterApi === undefined) return
  void rosterApi.list().then((result) => {
    if (!result.ok) {
      console.warn('[dsh-composer-model-badge] agentPresets.list not ok', result)
      return
    }
    const next: Record<string, string> = {}
    for (const entry of result.value.presets) {
      // Mirror `presetDisplayText` (packages/client/ui-agent-preset/.../locales.ts:266):
      // user-authored presets localize through their preset.yml `name`;
      // shipped presets are intentionally absent from this map because the
      // stock chip localizes them via its own locale table — emitting an id
      // here would short-circuit that and break the stock i18n contract.
      if (entry.trust === 'user' && entry.name !== undefined) {
        next[entry.id] = entry.name
      }
    }
    console.debug('[dsh-composer-model-badge] roster fetched', next)
    presetDisplayById = Object.freeze(next)
    for (const listener of presetListeners) listener()
  }, (error) => {
    console.error('[dsh-composer-model-badge] agentPresets.list threw', error)
  })
}

/**
 * Client plugin body: register the badge dictionary and claim the composer
 * chain ahead of the stock one-shot takeover (priority -20 < -10).
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'composer-model-badge: dictionaries')
  ctx.slots.inject(
    'conversation.composer',
    () => ctx.slots.register({
      name: 'conversation.composer',
      priority: -20,
      locale: NS,
      select: selectModelBadge,
    }, ComposerModelBadge),
  )
  // Fill the preset display-name cache once at mount, again after every
  // connection generation reset, and again whenever the agent-presets
  // settings document changes (a freshly authored preset hits the wire
  // through the settings namespace, not through a connection reset).
  // Wrap the `ctx.on(...)` subscriptions in `ctx.effect(...)` so cordis
  // automatically removes the listeners when the plugin's fiber unloads —
  // there is no `'dispose'` event to register against.
  refreshPresetRoster(ctx)
  ctx.effect(() => {
    const offs = [
      ctx.on('connection/reset', () => refreshPresetRoster(ctx)),
      ctx.remote.$on('settings/document-updated', (ns) => {
        if (ns === 'agent-presets') refreshPresetRoster(ctx)
      }),
    ]
    return () => { for (const off of offs) off() }
  }, 'composer-model-badge: roster refresh on connection reset / preset settings change')
}

// MERGE NOTE (Phase 1.5/1.7): the merged `lib/client.js` does the
// single `__ModuleLoader__.load({id: '@zach-tao/dsh-specify-
// subagent-suite', factory})` and combines three client halves. This
// composer's named exports (`apply`, `inject`) are exported as default
// for the merged entry to read. The factory function returns
// `{ apply, inject, ComposerModelBadge, selectModelBadge }` (the same
// shape as the pre-merge tsdown output).
export default { apply, inject, ComposerModelBadge, selectModelBadge }
