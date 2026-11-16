// The plugin's one setting, kept as a small JSON file in the DSH home. Writes go through a temp file and
// a rename, so a crash mid-write cannot leave half a file behind.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

export const DEFAULT_SETTINGS = Object.freeze({ autoTitle: false })

export const settingsPath = (env = process.env) => join(env.DSH_HOME || join(homedir(), '.dsh'), 'dsh-beta-layout-folder-file.json')

/** Only known fields, with their types enforced. */
export const normalizeSettings = (value) => ({ autoTitle: value?.autoTitle === true })

export function readSettings(path) {
  try {
    return normalizeSettings(JSON.parse(readFileSync(path, 'utf8')))
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function writeSettings(path, settings) {
  mkdirSync(dirname(path), { recursive: true })
  const temp = `${path}.${process.pid}.tmp`
  writeFileSync(temp, JSON.stringify(settings, null, 2))
  renameSync(temp, path)
}
