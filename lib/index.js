// Merged host entry point for @zach-tao/dsh-specify-subagent-suite.
//
// Imports the three host halves in a fixed order. The order matters:
// subdisp must run BEFORE subpro (it publishes the `subagentDispatch`
// service that subpro's `apply(ctx, dispatch)` consumes). subctl
// runs LAST so its `agent/request` hook fires AFTER subdisp's hook,
// preserving the existing effort-stack + template-override
// precedence on each LLM request.
//
// MERGE NOTE (Phase 1.8 / 0.5.1(A)): each host half exposes an
// `apply(ctx, ...?)` function. subdisp and subctl take just `ctx`;
// subpro takes `(ctx, dispatch)` where `dispatch` is the impl
// `subdisp` published via `ctx.provide('subagentDispatch', impl)`. We
// capture the impl synchronously in this entry and pass it as the
// second argument to subpro.apply.
//
// Inject array: union of all three host halves minus
// `subagentDispatch` (which is provided internally by subdisp, so
// the fiber must NOT declare it on `inject` — that would deadlock
// the cordis runtime).
import { apply as subdispApply } from './host/subdisp.js'
import { apply as subproApply, promoteSubagentPro } from './host/subpro.js'
import { apply as subctlApply } from './host/subctl.js'

export const inject = [
  'subagents',
  'llm',
  'agents',
  'agentPresets',
  'sessionQuery',
  'timer',
  'tools',
  'systemPrompt',
  'webServer',
]

// dsh-subdisp publishes `subagentDispatch` via `ctx.provide(name, impl)`
// and returns the impl from its apply(). The runtime contract lets one
// plugin's `provide` be read by another plugin's `ctx.get(name)` ONLY
// within the same fiber, so subpro receives the impl as a direct
// argument instead of injecting the service.
//
// K4a fix (2026-08-23): this entry previously monkey-patched ctx.provide
// around subdisp's apply to intercept the impl. The patch did NOT stay
// local: ctx.provide resolves through the reflect mixin accessor, whose
// `set` writes onto the process-wide ReflectService instance, so the
// override leaked past the finally-restore and rebound every later
// provide (from ANY plugin, ANY fiber) to this suite's ctx. Preset
// subtrees then registered planMode/workflowEngine/fs/terminals onto the
// suite's fiber in the global realm and every preset mount failed with
// `service "..." has been registered`. Returning the impl from apply()
// captures it with zero global mutation.
export async function apply(ctx) {
  const dispatchImpl = subdispApply(ctx)
  if (dispatchImpl === undefined || dispatchImpl === null) {
    throw new Error('dsh-specify-subagent-suite: subdisp failed to publish subagentDispatch')
  }
  // subpro needs the captured impl passed in directly (it cannot read
  // ctx.subagentDispatch because its `inject` no longer lists it).
  await subproApply(ctx, dispatchImpl)
  // subctl last.
  subctlApply(ctx)
}

// Re-export so the unit test (tests/promote-listener.test.mjs) can
// import the pure listener function without booting a DSH composition.
// Same contract the dsh-subpro tests relied on before the merge.
export { promoteSubagentPro }
