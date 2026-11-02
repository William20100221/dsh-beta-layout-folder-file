import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Load lib/client.js the way the shell does, with stub shared modules.
let registration
globalThis.window = { __ModuleLoader__: { load: (r) => (registration = r) } }
new Function(readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8'))()
const lib = registration.factory((name) => (name === 'react' ? { createElement: () => null } : {}))

const base = { entries: [], folders: {}, collapsed: {} }

test('reconcile prepends new workspaces and drops gone ones', () => {
  const stored = { ...base, entries: ['w:a', 'f:x', 'w:gone'], folders: { x: { title: 'X', children: ['b', 'gone'] } } }
  const out = lib.reconcile(stored, ['a', 'b', 'c'])
  assert.deepEqual(out.entries, ['w:c', 'w:a', 'f:x'])
  assert.deepEqual(out.folders.x.children, ['b'])
})

test('moveItem puts a workspace into a folder and back out', () => {
  let layout = lib.addFolder({ ...base, entries: ['w:a', 'w:b'] }, 'x', 'School')
  layout = lib.moveItem(layout, 'w:a', { parent: 'x', index: Infinity })
  assert.deepEqual(layout.entries, ['f:x', 'w:b'])
  assert.deepEqual(layout.folders.x.children, ['a'])
  assert.deepEqual(lib.positionOf(layout, 'w:a'), { parent: 'x', index: 0 })
  layout = lib.moveItem(layout, 'w:a', { parent: 'root', index: 0 })
  assert.deepEqual(layout.entries, ['w:a', 'f:x', 'w:b'])
  assert.deepEqual(layout.folders.x.children, [])
})

test('moveItem reorders at the top level and refuses folders inside folders', () => {
  const layout = lib.addFolder(lib.addFolder({ ...base, entries: ['w:a'] }, 'x', 'X'), 'y', 'Y')
  assert.deepEqual(lib.moveItem(layout, 'f:y', { parent: 'root', index: 2 }).entries, ['f:x', 'w:a', 'f:y'])
  assert.equal(lib.moveItem(layout, 'f:y', { parent: 'x', index: 0 }), layout)
})

test('deleteFolder keeps its workspaces in its place', () => {
  let layout = lib.addFolder({ ...base, entries: ['w:a', 'w:b', 'w:c'] }, 'x', 'X')
  layout = lib.moveItem(layout, 'w:b', { parent: 'x', index: 0 })
  layout = lib.moveItem(layout, 'w:c', { parent: 'x', index: 1 })
  layout = lib.moveItem(layout, 'f:x', { parent: 'root', index: 1 })
  assert.deepEqual(lib.deleteFolder(layout, 'x').entries, ['w:a', 'w:b', 'w:c'])
})

test('layout store survives a reload and ignores junk', () => {
  const data = new Map()
  const storage = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }
  const a = lib.createLayoutStore(storage)
  a.set(lib.renameFolder(lib.addFolder(base, 'x', 'X'), 'x', 'Past Papers'))
  assert.equal(lib.createLayoutStore(storage).get().folders.x.title, 'Past Papers')
  data.set('dsh-claude-layout:v1', '{oops')
  assert.deepEqual(lib.createLayoutStore(storage).get().entries, [])
})

test('ago formats like the sidebar', () => {
  const now = 1_000_000_000_000
  assert.equal(lib.ago(now - 30_000, now), 'now')
  assert.equal(lib.ago(now - 5 * 3600_000, now), '5h')
  assert.equal(lib.ago(now - 3 * 86400_000, now), '3d')
})
