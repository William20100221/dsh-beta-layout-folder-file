import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Load lib/client.js the way the shell does.
let registration
globalThis.window = { __ModuleLoader__: { load: (r) => (registration = r) } }
new Function(readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8'))()
const lib = registration.factory((name) => (name === 'react' ? { createElement: () => null } : {}))

const apply = (order, moves) => {
  const out = [...order]
  for (const [id, before] of moves) {
    out.splice(out.indexOf(id), 1)
    out.splice(before === null ? out.length : out.indexOf(before), 0, id)
  }
  return out
}

test('folders group their workspaces above loose ones, keeping DSH order inside', () => {
  let state = lib.addFolder(lib.addFolder({ folders: [] }, 'r', 'Robotics'), 's', 'School')
  state = lib.assign(lib.assign(lib.assign(state, 'phys', 's'), 'maths', 's'), 'robot', 'r')
  assert.deepEqual(lib.desiredOrder(['essay', 'robot', 'maths', 'chem', 'phys'], state), ['maths', 'phys', 'robot', 'essay', 'chem'])
})

test('a workspace dropped on a folder header goes to the end of that folder', () => {
  const state = lib.assign(lib.assign(lib.addFolder({ folders: [] }, 's', 'School'), 'b', 's'), 'a', 's')
  assert.deepEqual(lib.desiredOrder(['a', 'b', 'c'], state, 'a'), ['b', 'a', 'c'])
})

test('planMoves reaches the target with the fewest moves', () => {
  const order = ['a', 'b', 'c', 'd']
  const target = ['d', 'a', 'b', 'c']
  const moves = lib.planMoves(order, target)
  assert.deepEqual(moves, [['d', 'a']])
  assert.deepEqual(apply(order, moves), target)
  const shuffled = ['e', 'c', 'a', 'd', 'b']
  assert.deepEqual(apply(shuffled, lib.planMoves(shuffled, ['a', 'b', 'c', 'd', 'e'])), ['a', 'b', 'c', 'd', 'e'])
  assert.deepEqual(lib.planMoves(order, order), [])
})

test('assign moves a workspace between folders and out', () => {
  let state = lib.addFolder(lib.addFolder({ folders: [] }, 'x', 'X'), 'y', 'Y')
  state = lib.assign(state, 'w', 'x')
  state = lib.assign(state, 'w', 'y')
  const members = (id) => state.folders.find((f) => f.id === id).members
  assert.deepEqual([members('x'), members('y')], [[], ['w']])
  state = lib.assign(state, 'w', null)
  assert.deepEqual([members('x'), members('y')], [[], []])
})

test('folders reorder, delete without touching workspaces, and prune gone ones', () => {
  let state = lib.addFolder(lib.addFolder(lib.addFolder({ folders: [] }, 'c', 'C'), 'b', 'B'), 'a', 'A')
  assert.deepEqual(lib.moveFolder(state, 'a', null).folders.map((f) => f.id), ['b', 'c', 'a'])
  assert.deepEqual(lib.moveFolder(state, 'c', 'b').folders.map((f) => f.id), ['a', 'c', 'b'])
  state = lib.assign(lib.assign(state, 'w1', 'a'), 'gone', 'a')
  assert.deepEqual(lib.prune(state, ['w1']).folders[0].members, ['w1'])
  assert.deepEqual(lib.deleteFolder(state, 'a').folders.map((f) => f.id), ['b', 'c'])
})

test('store survives a reload and ignores junk', () => {
  const data = new Map()
  const storage = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }
  lib.createStore(storage).set(lib.updateFolder(lib.addFolder({ folders: [], collapsedSessions: {} }, 'x', 'X'), 'x', { title: 'Past Papers' }))
  assert.equal(lib.createStore(storage).get().folders[0].title, 'Past Papers')
  data.set('dsh-claude-layout:v2', '{oops')
  assert.deepEqual(lib.createStore(storage).get().folders, [])
})

test('folders made with 0.1.0 carry over', () => {
  const old = { entries: ['w:a', 'f:x'], folders: { x: { title: 'School', children: ['b', 'c'] } }, collapsed: { 'f:x': true } }
  const storage = { getItem: (k) => (k === 'dsh-claude-layout:v1' ? JSON.stringify(old) : null), setItem: () => {} }
  assert.deepEqual(lib.createStore(storage).get().folders, [{ id: 'x', title: 'School', collapsed: true, members: ['b', 'c'] }])
  assert.deepEqual(lib.createStore(storage).get().collapsedSessions, {})
})

test('treeOrder nests forks under their source, depth-first, marking last children', () => {
  const parent = { b: 'a', c: 'a', d: 'c', e: 'zzz' }
  const out = lib.treeOrder(['e', 'd', 'b', 'a', 'c'], (id) => parent[id])
  assert.deepEqual(out.map((n) => [n.id, n.depth, n.last, n.parent]), [
    ['e', 0, false, false],
    ['a', 0, false, true],
    ['b', 1, false, false],
    ['c', 1, true, true],
    ['d', 2, true, false]
  ])
})

test('toggleSessionCollapsed flips one session and keeps the rest', () => {
  let state = lib.toggleSessionCollapsed({ folders: [], collapsedSessions: {} }, 'a')
  state = lib.toggleSessionCollapsed(state, 'b')
  assert.deepEqual(state.collapsedSessions, { a: true, b: true })
  assert.deepEqual(lib.toggleSessionCollapsed(state, 'a').collapsedSessions, { b: true })
})
