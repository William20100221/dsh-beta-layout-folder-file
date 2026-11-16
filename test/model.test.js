import { test } from 'node:test'
import assert from 'node:assert/strict'

import { EMPTY, addFolder, assign, deleteFolder, desiredOrder, moveFolder, planMoves, prune, setAllCollapsed, splitIcon, toggleSessionCollapsed, treeOrder } from '../src/client/model.js'

const apply = (order, moves) => {
  const out = [...order]
  for (const [id, before] of moves) {
    out.splice(out.indexOf(id), 1)
    out.splice(before === null ? out.length : out.indexOf(before), 0, id)
  }
  return out
}

test('folders group their workspaces above loose ones, keeping DSH order inside', () => {
  let state = addFolder(addFolder(EMPTY, 'r', 'Robotics'), 's', 'School')
  state = assign(assign(assign(state, 'phys', 's'), 'maths', 's'), 'robot', 'r')
  assert.deepEqual(desiredOrder(['essay', 'robot', 'maths', 'chem', 'phys'], state), ['maths', 'phys', 'robot', 'essay', 'chem'])
})

test('a dropped workspace lands where DSH would put it', () => {
  const state = assign(assign(addFolder(EMPTY, 's', 'School'), 'b', 's'), 'a', 's')
  assert.deepEqual(desiredOrder(['a', 'b', 'c'], state, { id: 'a', before: null }), ['b', 'a', 'c'], 'header drop: end of folder')
  assert.deepEqual(desiredOrder(['a', 'b', 'c', 'd'], assign(state, 'd', 's'), { id: 'd', before: 'b' }), ['a', 'd', 'b', 'c'], 'slot above b')
  assert.deepEqual(desiredOrder(['a', 'b', 'c', 'd'], state, { id: 'd', before: 'c' }), ['a', 'b', 'd', 'c'], 'loose: slot above c')
  assert.deepEqual(desiredOrder(['a', 'b', 'c'], state, { id: 'c', before: 'a' }), ['a', 'b', 'c'], 'pin outside its group is ignored')
})

test('planMoves reaches the target with the fewest moves', () => {
  const order = ['a', 'b', 'c', 'd']
  const target = ['d', 'a', 'b', 'c']
  const moves = planMoves(order, target)
  assert.deepEqual(moves, [['d', 'a']])
  assert.deepEqual(apply(order, moves), target)
  const shuffled = ['e', 'c', 'a', 'd', 'b']
  assert.deepEqual(apply(shuffled, planMoves(shuffled, ['a', 'b', 'c', 'd', 'e'])), ['a', 'b', 'c', 'd', 'e'])
  assert.deepEqual(planMoves(order, order), [])
})

test('assign moves a workspace between folders and out', () => {
  let state = addFolder(addFolder(EMPTY, 'x', 'X'), 'y', 'Y')
  const members = (id) => state.folders.find((f) => f.id === id).members
  state = assign(state, 'w', 'x')
  state = assign(state, 'w', 'y')
  assert.deepEqual([members('x'), members('y')], [[], ['w']])
  state = assign(state, 'w', null)
  assert.deepEqual([members('x'), members('y')], [[], []])
})

test('folders reorder, collapse together, delete without touching workspaces, and prune gone ones', () => {
  let state = addFolder(addFolder(addFolder(EMPTY, 'c', 'C'), 'b', 'B'), 'a', 'A')
  assert.deepEqual(moveFolder(state, 'a', null).folders.map((f) => f.id), ['b', 'c', 'a'])
  assert.deepEqual(moveFolder(state, 'c', 'b').folders.map((f) => f.id), ['a', 'c', 'b'])
  assert.ok(setAllCollapsed(state, true).folders.every((f) => f.collapsed))
  state = assign(assign(state, 'w1', 'a'), 'gone', 'a')
  assert.deepEqual(prune(state, ['w1']).folders[0].members, ['w1'])
  assert.deepEqual(deleteFolder(state, 'a').folders.map((f) => f.id), ['b', 'c'])
})

test('treeOrder nests forks under their source, depth-first, with counts and last marks', () => {
  const parent = { b: 'a', c: 'a', d: 'c', e: 'zzz' }
  const out = treeOrder(['e', 'd', 'b', 'a', 'c'], (id) => parent[id])
  assert.deepEqual(out.map((n) => [n.id, n.depth, n.last, n.childCount]), [
    ['e', 0, false, 0],
    ['a', 0, false, 2],
    ['b', 1, false, 0],
    ['c', 1, true, 1],
    ['d', 2, true, 0]
  ])
})

test('toggleSessionCollapsed flips one session and keeps the rest', () => {
  let state = toggleSessionCollapsed(EMPTY, 'a')
  state = toggleSessionCollapsed(state, 'b')
  assert.deepEqual(state.collapsedSessions, { a: true, b: true })
  assert.deepEqual(toggleSessionCollapsed(state, 'a').collapsedSessions, { b: true })
})

test('a leading emoji becomes the folder icon', () => {
  assert.deepEqual(splitIcon('📚 School'), { icon: '📚', text: 'School' })
  assert.deepEqual(splitIcon('👩‍💻Code'), { icon: '👩‍💻', text: 'Code' })
  assert.deepEqual(splitIcon('School'), { icon: '', text: 'School' })
  assert.deepEqual(splitIcon('2026 papers'), { icon: '', text: '2026 papers' })
})
