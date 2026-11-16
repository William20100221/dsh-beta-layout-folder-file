import { test } from 'node:test'
import assert from 'node:assert/strict'

import { LEGACY_STORAGE_KEY, STORAGE_KEY } from '../src/client/constants.js'
import { addFolder, updateFolder } from '../src/client/model.js'
import { createSignal, createStore } from '../src/client/store.js'

const memory = (seed = {}) => {
  const data = new Map(Object.entries(seed))
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }
}

test('store survives a reload, notifies, and ignores junk', () => {
  const storage = memory()
  const store = createStore(storage)
  let calls = 0
  store.subscribe(() => calls++)
  store.set(updateFolder(addFolder(store.get(), 'x', 'X'), 'x', { title: 'Past Papers' }))
  assert.equal(calls, 1)
  assert.equal(createStore(storage).get().folders[0].title, 'Past Papers')
  assert.equal(store.getSnapshot(), store.get(), 'usable as an observe source')
  storage.data.set(STORAGE_KEY, '{oops')
  assert.deepEqual(createStore(storage).get().folders, [])
})

test('folders made with 0.1.0 carry over', () => {
  const old = { entries: ['w:a', 'f:x'], folders: { x: { title: 'School', children: ['b', 'c'] } }, collapsed: { 'f:x': true } }
  const store = createStore(memory({ [LEGACY_STORAGE_KEY]: JSON.stringify(old) }))
  assert.deepEqual(store.get().folders, [{ id: 'x', title: 'School', collapsed: true, members: ['b', 'c'] }])
  assert.deepEqual(store.get().collapsedSessions, {})
})

test('a signal is a minimal snapshot store', () => {
  const signal = createSignal(0)
  const seen = []
  const off = signal.subscribe(() => seen.push(signal.getSnapshot()))
  signal.set(1)
  off()
  signal.set(2)
  assert.deepEqual(seen, [1])
  assert.equal(signal.get(), 2)
})
