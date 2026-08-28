// Merged client entry for @zach-tao/dsh-specify-subagent-suite.
//
// v6 Phase 0.5.2/1.5/1.6/1.9 (post-audit-corrected): ONE self-contained
// factory combines the three client halves. The three halves'
// bodies are imported below; tsdown INLINES them into the factory
// body during the build. The produced `lib/client.js` has no
// relative `require()` to sub-files at runtime — the three halves'
// code lives as `//#region ... //#endregion` blocks alongside the
// merged entry.
//
// The `__ModuleLoader__.load` wrapper in tsdown's banner emits the
// required registration under id `@zach-tao/dsh-specify-subagent-suite`
// (the npm package name; required by
// `packages/client/modules/src/client/system.ts:104-110` which
// rejects a bundle that does not register the graph-row id).
import agentSidebarFactory from './client/agent-sidebar.js'
import composerMod from './client/index.tsx'
import subctlPanelFactory from './client/subctl-panel.js'

// v6 audit-fix (post R7-confirm): the union `inject` is `export const`
// (not `const`) so the tsdown output emits
// `exports.inject = inject;` — required by
// `packages/extensions/cordis-client-runner/src/registry.ts:316-330`
// which reads the bundle module's `inject` export.
export const inject = ['slots', 'sessions', 'layout', 'locale', 'connection', 'remote', 'remote.agentPresets']

// v6 audit-fix (post R7-confirm): this `apply` is exported as
// `exports.apply` by the tsdown output. The framework calls it
// with `(ctx)` — the `ctx` is the client cordis Context.
//
// `require` is in lexical scope from the surrounding
// `factory: (require) => { ... }` (the tsdown banner wraps the
// bundled body in this factory). Each half's factory takes a
// `require` parameter; we forward the platform one.
//
// Order: agent-sidebar (priority -100) → composer (priority -20)
// → subctl-panel (order 26). Matches the per-half cordis priority
// and the upstream slot-registration order.
export function apply(ctx) {
  // `require` is the factory's parameter from the surrounding
  // `factory: (require) => { ... }`. tsdown hoists it into lexical
  // scope of the emitted body. Reference it directly here.
  // (tsdown output structure:
  //   window.__ModuleLoader__.load({
  //     id: '...',
  //     factory: (require) => {
  //       // inlined halves here
  //       ... apply body here, with `require` in scope ...
  //     }
  //   })
  // )
  // We pass `require` to each half's factory; the half's apply is
  // then called with `ctx`.
  agentSidebarFactory(require).apply(ctx)
  composerMod.apply(ctx)
  subctlPanelFactory(require).apply(ctx)
}
