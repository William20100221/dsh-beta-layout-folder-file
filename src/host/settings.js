// The plugin's host-side state, kept as a small JSON file in the DSH home:
//   { autoTitle: boolean, titled: { [sessionId]: title } }
// `titled` remembers the last title this plugin gave each session, so a session whose current title is
// something else was renamed by the user (DSH records both with the same source). Writes go through a
// temp file and a rename, so a crash mid-write cannot leave half a file behind.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

export const DEFAULT_STATE = Object.freeze({ autoTitle: false, titled: Object.freeze({}) })
/** Sessions remembered in `titled`; the oldest entries go first when the map grows past this. */
export const TITLED_MAX = 500

export const settingsPath = (env = process.env) => join(env.DSH_HOME || join(homedir(), '.dsh'), 'dsh-beta-layout-folder-file.json')

/** The user-facing settings only, with their types enforced. */
export const normalizeSettings = (value) => ({ autoTitle: value?.autoTitle === true })

/** The whole file, each field validated; a missing or broken file reads as the defaults. */
export function readState(path) {
  try {
    const value = JSON.parse(readFileSync(path, 'utf8'))
    const titled = {}
    for (const [id, title] of Object.entries(value?.titled ?? {})) if (typeof id === 'string' && typeof title === 'string') titled[id] = title
    return { ...normalizeSettings(value), titled }
  } catch {
    return { autoTitle: false, titled: {} }
  }
}

export function writeState(path, state) {
  mkdirSync(dirname(path), { recursive: true })
  const temp = `${path}.${process.pid}.tmp`
  writeFileSync(temp, JSON.stringify(state, null, 2))
  renameSync(temp, path)
}

/** `titled` with `sessionId → title` set and the oldest entries dropped past TITLED_MAX. */
export function rememberTitle(titled, sessionId, title) {
  const next = { ...titled }
  delete next[sessionId]
  next[sessionId] = title
  const keys = Object.keys(next)
  for (const key of keys.slice(0, Math.max(0, keys.length - TITLED_MAX))) delete next[key]
  return next
}
