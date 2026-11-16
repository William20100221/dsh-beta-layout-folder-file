import { LEGACY_STORAGE_KEY, STORAGE_KEY } from './constants.js'
import { EMPTY } from './model.js'

// Folder state in this app's localStorage, like DSH's own session order. `getSnapshot`/`subscribe` make it
// usable as an `observe` source for DSH's context menus.
// ponytail: browser-local; move it to the Host if folders must follow the user across devices.
export function createStore(storage) {
  const read = () => {
    try {
      const value = JSON.parse(storage?.getItem(STORAGE_KEY) ?? 'null')
      if (value && Array.isArray(value.folders)) return { ...EMPTY, ...value }
      // 0.1.0 kept folders as { entries: ['f:id', ...], folders: { id: { title, children } }, collapsed }.
      const old = JSON.parse(storage?.getItem(LEGACY_STORAGE_KEY) ?? 'null')
      if (old && Array.isArray(old.entries) && old.folders) {
        const folders = old.entries
          .filter((key) => key.startsWith('f:') && old.folders[key.slice(2)])
          .map((key) => ({
            id: key.slice(2),
            title: old.folders[key.slice(2)].title,
            collapsed: old.collapsed?.[key] === true,
            members: [...old.folders[key.slice(2)].children]
          }))
        return { ...EMPTY, folders }
      }
    } catch {}
    return EMPTY
  }
  let state = read()
  const listeners = new Set()
  const get = () => state
  return {
    get,
    getSnapshot: get,
    subscribe: (listener) => (listeners.add(listener), () => listeners.delete(listener)),
    set: (next) => {
      state = next
      try {
        storage?.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {}
      listeners.forEach((listener) => listener())
    }
  }
}

/** A tiny snapshot store for transient UI facts (e.g. which sessions are being titled). */
export function createSignal(initial) {
  let value = initial
  const listeners = new Set()
  return {
    get: () => value,
    getSnapshot: () => value,
    subscribe: (listener) => (listeners.add(listener), () => listeners.delete(listener)),
    set: (next) => {
      value = next
      listeners.forEach((listener) => listener())
    }
  }
}
