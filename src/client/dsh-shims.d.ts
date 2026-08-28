/**
 * Self-contained ambient type shims for this plugin's compile surface.
 *
 * The plugin deliberately does NOT depend on @deepseek-ai/* packages at
 * runtime (all cross-plugin collaboration goes through cordis services and
 * the loader module table), so there is nothing to npm-install for types.
 * Instead of linking the whole monorepo type graph (an unbounded closure —
 * runtime/client pulls in cordis → cosmokit → …), we declare the minimal
 * ambient surface this bundle actually reads. These must stay in sync with
 * the real packages (see the per-module doc comments); drift shows up as a
 * type error here, not a silent runtime failure, because every name below is
 * consumed by `index.tsx`.
 */

declare module '@deepseek-ai/dsh-client-locale/client' {
  // Side-effect only: the real package augments the slots locale map. Empty
  // here; `import type {}` in index.tsx is satisfied by the module existing.
}

declare module '@deepseek-ai/dsh-client-ui-conversation/client' {
  /** Owner currency of the conversation.composer chain. */
  export interface ComposerChainProps {
    session: {
      subagent: {
        address: { mode: 'one-shot' | 'continuable' }
        parentAvailable: boolean
      } | null
      running?: boolean
    } | null
  }
}

declare module '@deepseek-ai/dsh-client-runtime/client' {
  /** Minimal ClientContext: the cordis ctx surface this plugin uses. */
  export interface ClientContext {
    effect(fn: () => void | (() => void), name?: string): void
    /**
     * Cordis event hook: subscribe to an emit event; the returned function
     * unsubscribes. There is no `'dispose'` event — cordis tears a fiber
     * down by walking the registered effect disposers, so disposal must go
     * through `ctx.effect(() => ctx.on(...), 'name')`, not `ctx.on('dispose', …)`.
     */
    on(event: 'connection/reset', handler: () => void): () => void
    /** Cordis Service lookup. `undefined` while the Service has not appeared. */
    get<T = unknown>(service: string): T | undefined
    /**
     * Remote namespace (DSH forwards allowlisted events verbatim from the
     * host). `$on` subscribes to forwarded emit events —
     * `settings/document-updated` fires whenever any settings document
     * changes, carrying the namespace id; the listener filters to the
     * namespaces it cares about. Since 0.1.2 the remote namespace also
     * carries the migrated `connection.api` call surface (`agentPresets`,
     * …) directly — see `RemoteAgentPresets` below.
     */
    remote: {
      $on(event: 'settings/document-updated', handler: (ns: string) => void): () => void
      agentPresets?: RemoteAgentPresets
    }
    locale: {
      register(ns: string, dict: Record<string, unknown>): void
    }
    slots: {
      inject(name: string, factory: () => unknown, opts?: unknown): void
      register(opts: Record<string, unknown>, component?: unknown): unknown
    }
  }

  /**
   * `api.agentPresets.list` reply: every preset the deployment composes, in
   * root-precedence order. We only consume `presets` here; see
   * `packages/host/apiproxy/src/api/agent-presets.ts:16` for the full
   * `AgentPresetEntry` contract.
   */
  export interface AgentPresetEntry {
    readonly id: string
    readonly trust: 'system' | 'user'
    readonly isDefault: boolean
    /** Display name the preset published; absent when it published none. */
    readonly name?: string
    readonly description?: string
    readonly broken?: string
  }

  /**
   * `remote.agentPresets.list()` wire contract (0.1.2 remote namespace — the
   * successor of the pre-0.1.2 `connection.api.agentPresets.list` loopback
   * after the ApiProxy package removal). Every preset the deployment
   * composes, in root-precedence order; we only consume `presets` here. See
   * `packages/api/remotes/src/api/agent-presets.ts` for the full
   * `AgentPresetEntry` contract.
   */
  export interface RemoteAgentPresets {
    list(): Promise<
      | { ok: true; value: { presets: readonly AgentPresetEntry[] } }
      | { ok: false; error: { code: string; message: string } }
    >
  }

  export type SnapshotSelectorHook<S> = <T>(selector: (s: S) => T) => T
  export type MaybeSnapshotSelectorHook<S> = {
    <T>(selector: (s: S | undefined) => T, fallback: T): T
  }

  export type SessionId = string & { readonly __brand: 'SessionId' }
  export interface SubagentAddress {
    parentSessionId: SessionId
    childSessionId: SessionId
    mode: 'one-shot' | 'continuable'
  }

  /**
   * Effective provider/model/sampling config of one provider request
   * (mirrors AssistantRequestConfig in client-runtime conversation.ts).
   */
  export interface AssistantRequestConfig {
    provider: string
    model: string
    reasoningEffort?: string
  }

  /**
   * One trajectory request record.
   * Mirrors RequestView: assistant (generative) vs compaction requests.
   */
  export interface TrajectoryRequest {
    purpose: 'assistant' | 'compaction'
    requestConfig?: AssistantRequestConfig
  }

  /** Shape of the live trajectory view snapshot (ui-trajectory contract). */
  export interface TrajectoryViewSnapshot {
    readonly requests: readonly TrajectoryRequest[]
  }

  /** Merge-extensible view-target map; plugins augment per view package. */
  export interface ConversationViewSnapshotMap {}

  export interface ConversationViewSnapshotStore {
    get<Target extends keyof ConversationViewSnapshotMap & string>(
      target: Target,
    ): ConversationViewSnapshotMap[Target] | undefined
  }

  /** Immutable public view of one assembled conversation (client-runtime). */
  export interface ConversationSnapshot {
    sessionId: SessionId
    views: ConversationViewSnapshotStore
    running: boolean
    subagent: {
      address: SubagentAddress
      parentAvailable: boolean
    } | null
  }
}

declare module '@deepseek-ai/dsh-client-runtime/client' {
  /** ui-trajectory registers the 'trajectory' view target (see its trajectory-contract). */
  export interface ConversationViewSnapshotMap {
    trajectory: import('@deepseek-ai/dsh-client-runtime/client').TrajectoryViewSnapshot
  }

  /**
   * Sessions store snapshot — only the slice this plugin reads. Declared
   * here (not in the ui-slots module) so `PropsRuntime.useSessions` can
   * reference it through the real runtime/client module path that the
   * compiler sees on the import in `index.tsx`.
   */
  export interface SessionsStoreSnapshot {
    byId: Readonly<Record<string, { agentPreset?: string } | undefined>>
    current?: string
  }
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  /** Locale namespace map (ui-slots contract); plugins augment per namespace. */
  export interface LocaleNamespaceMap {}

  /** Locale props for one namespace: the translate function. */
  export type PropsLocale<N extends keyof LocaleNamespaceMap & string> = {
    t: (key: string, params?: Record<string, unknown>) => string
  }

  /**
   * Runtime props share for a slot entry: owner share + session standard kit
   * (`useSession`, bound to the conversation snapshot) + global seat.
   * Minimal stand-in for the real generic.
   */
  export type PropsRuntime<K extends string = string> = {
    useSession: import('@deepseek-ai/dsh-client-runtime/client').SnapshotSelectorHook<
      import('@deepseek-ai/dsh-client-runtime/client').ConversationSnapshot
    >
    useSessions: import('@deepseek-ai/dsh-client-runtime/client').SnapshotSelectorHook<
      import('@deepseek-ai/dsh-client-runtime/client').SessionsStoreSnapshot
    >
  }
}