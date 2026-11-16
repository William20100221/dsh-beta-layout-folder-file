import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { normalizeSettings, readSettings, settingsPath, writeSettings } from '../src/host/settings.js'

test('settings live in the DSH home and round-trip through an atomic write', () => {
  const home = mkdtempSync(join(tmpdir(), 'dshcl-'))
  try {
    const path = settingsPath({ DSH_HOME: home })
    assert.equal(path, join(home, 'dsh-beta-layout-folder-file.json'))
    assert.deepEqual(readSettings(path), { autoTitle: false }, 'missing file: defaults')
    writeSettings(path, normalizeSettings({ autoTitle: true, junk: 1 }))
    assert.deepEqual(readSettings(path), { autoTitle: true })
    assert.deepEqual(readdirSync(home), ['dsh-beta-layout-folder-file.json'], 'no temp file left behind')
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('normalizeSettings keeps only known fields with the right types', () => {
  assert.deepEqual(normalizeSettings({ autoTitle: 'yes' }), { autoTitle: false })
  assert.deepEqual(normalizeSettings(null), { autoTitle: false })
})
