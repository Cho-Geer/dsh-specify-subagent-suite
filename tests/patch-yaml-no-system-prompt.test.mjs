// Configuration-layer snapshot test for dsh-specify-subagent-suite's
// `cordis.patch.yml`.
//
// Locks the contract documented at the top of `../lib/host/subpro.js`:
// the patch MUST NOT touch the `system-prompt` row or define a
// `toolOrder`, because either would:
//   (a) replace the row's whole `config` and silently wipe the
//       deployment persona that the base/web-app bundles compose (B1);
//   (b) throw on every `presentAs('code')` session because the
//       registry's `wireSchemas` collapses `knownNames` to
//       `[RUN_CODE_NAME]` in code mode (B2).
//
// MERGE NOTE (Phase 1.11): the row id is now `specify-subagent-suite`
// (Phase 0.2) and the row name is `@zach-tao/dsh-specify-subagent-suite`
// (Phase 0.1). The "exactly 1 top-level insert" check stays because
// Phase 0.3.A chose single-Cordis-row layout; if 0.3.B is ever
// re-selected, relax this count.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const PATCH_PATH = join(HERE, '..', 'cordis.patch.yml')

test('B1: cordis.patch.yml must not override the system-prompt row', async () => {
  const text = await readFile(PATCH_PATH, 'utf8')

  // The patch must insert exactly one row (Phase 0.3.A — single
  // Cordis row). Any other top-level entry would either conflict
  // with another row or override a base-bundle row by id.
  const topLevelInserts = text.match(/^- insert:/gm) ?? []
  assert.equal(
    topLevelInserts.length,
    1,
    `expected exactly 1 top-level "- insert:" block in cordis.patch.yml, got ${topLevelInserts.length}\n${text}`,
  )

  // The injected row must be id: specify-subagent-suite (Phase 0.2)
  // and name: @zach-tao/dsh-specify-subagent-suite (Phase 0.1); not
  // system-prompt (which would clobber the base bundle's persona
  // override) and not anything else that could collide with shipped
  // rows.
  assert.match(
    text,
    /id: specify-subagent-suite[\s\S]*?name: ['"]@zach-tao\/dsh-specify-subagent-suite['"]/,
    'inserted row must declare id: specify-subagent-suite and name: @zach-tao/dsh-specify-subagent-suite',
  )

  // No - id: system-prompt override anywhere (would replace the
  // base/web-app persona with whatever the merged bundle declares).
  assert.doesNotMatch(
    text,
    /- id: system-prompt\b/,
    'patch must not declare "- id: system-prompt" (would wipe the base/web-app persona)',
  )

  // No toolOrder: field anywhere (would throw on every presentAs('code')
  // session because wireSchemas collapses knownNames to [RUN_CODE_NAME]).
  assert.doesNotMatch(
    text,
    /^\s*toolOrder:/m,
    'patch must not declare a `toolOrder:` field (would break code-mode assembly)',
  )
})
