// Unit test for dsh-subpro's `promoteSubagentPro` waterfall listener.
//
// Verifies the contract documented at the top of `lib/index.js`:
//   (a) when subagent_pro is in the assembly and not at position 0,
//       move it to position 0 (everything else shifts right);
//   (b) when subagent_pro is already at position 0, no-op;
//   (c) when subagent_pro is absent (e.g. code mode wire-collapse
//       produces [run_code] only), no-op — never throws;
//   (d) when assembly.tools is empty, no-op.
//
// This test does NOT boot a DSH composition: it imports the pure
// `promoteSubagentPro` function from `../lib/index.js` and exercises
// it against a synthetic assembly object. The runtime contract
// (`ctx.on('system-prompt/assemble', promoteSubagentPro)`) is unchanged
// — the function is the same code, just lifted to a named export
// for testability.
//
// Run with: `node --test tests/`
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { promoteSubagentPro } from '../lib/index.js'

function fire(assembly) {
  let nextCalled = false
  const result = promoteSubagentPro(
    assembly,
    /* _context */ {},
    () => { nextCalled = true },
  )
  return { result, nextCalled }
}

test('native mode: subagent_pro at index 3 is moved to position 0, others shift right', () => {
  const assembly = {
    tools: [
      { name: 'subagent' },
      { name: 'bash' },
      { name: 'read' },
      { name: 'subagent_pro' },
    ],
  }
  const { nextCalled } = fire(assembly)
  assert.deepEqual(
    assembly.tools.map((t) => t.name),
    ['subagent_pro', 'subagent', 'bash', 'read'],
  )
  assert.equal(nextCalled, true, 'listener must always call next()')
})

test('native mode: subagent_pro at index 0 is a no-op', () => {
  const assembly = {
    tools: [
      { name: 'subagent_pro' },
      { name: 'bash' },
      { name: 'read' },
    ],
  }
  const before = assembly.tools.map((t) => t.name)
  const { nextCalled } = fire(assembly)
  assert.deepEqual(assembly.tools.map((t) => t.name), before)
  assert.equal(nextCalled, true)
})

test('code mode: only [run_code], no subagent_pro, no-op (no throw)', () => {
  const assembly = { tools: [{ name: 'run_code' }] }
  const { nextCalled } = fire(assembly)
  assert.deepEqual(assembly.tools, [{ name: 'run_code' }])
  assert.equal(nextCalled, true)
})

test('code mode defensive: subagent_pro present, moved to front, run_code shifts', () => {
  // A real code-mode wireSchemas never returns this, but if someone
  // bypasses wireSchemas or hand-builds the assembly, the listener
  // must still surface subagent_pro without throwing.
  const assembly = {
    tools: [
      { name: 'run_code' },
      { name: 'subagent_pro' },
    ],
  }
  fire(assembly)
  assert.deepEqual(
    assembly.tools.map((t) => t.name),
    ['subagent_pro', 'run_code'],
  )
})

test('empty tools: no-op, does not throw', () => {
  const assembly = { tools: [] }
  const { nextCalled } = fire(assembly)
  assert.deepEqual(assembly.tools, [])
  assert.equal(nextCalled, true)
})

test('malformed tool entries: null/undefined-safe find', () => {
  // The runtime contracts on `t && t.name === 'subagent_pro'` — must
  // not throw on null or undefined entries (e.g. mid-write assembly
  // snapshots during the listener cascade).
  const assembly = {
    tools: [
      null,
      undefined,
      { name: 'subagent_pro' },
      { /* no name */ },
    ],
  }
  fire(assembly)
  // subagent_pro still moves to front; nulls/non-names are skipped.
  assert.equal(assembly.tools[0].name, 'subagent_pro')
  assert.equal(assembly.tools.length, 4)
})

test('always calls next() — required by the waterfall contract', () => {
  // If the listener didn't call next(), the systemPrompt assembly
  // would hang. Verify it on every path.
  const cases = [
    { tools: [] },
    { tools: [{ name: 'run_code' }] },
    { tools: [{ name: 'subagent_pro' }] },
    { tools: [{ name: 'subagent' }, { name: 'subagent_pro' }] },
  ]
  for (const a of cases) {
    const r = fire(a)
    assert.equal(r.nextCalled, true, `next() not called for: ${JSON.stringify(a.tools)}`)
  }
})