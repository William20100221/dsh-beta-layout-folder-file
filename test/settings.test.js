import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { TITLED_MAX, normalizeSettings, readState, rememberTitle, settingsPath, writeState } from '../src/host/settings.js'

test('state lives in the DSH home and round-trips through an atomic write', () => {
  const home = mkdtempSync(join(tmpdir(), 'dshcl-'))
  try {
    const path = settingsPath({ DSH_HOME: home })
    assert.equal(path, join(home, 'dsh-beta-layout-folder-file.json'))
    assert.deepEqual(readState(path), { autoTitle: false, titled: {} }, 'missing file: defaults')
    writeState(path, { autoTitle: true, titled: { s1: 'Fix the build', s2: 7 }, junk: 1 })
    assert.deepEqual(readState(path), { autoTitle: true, titled: { s1: 'Fix the build' } }, 'only well-typed entries read back')
    assert.deepEqual(readdirSync(home), ['dsh-beta-layout-folder-file.json'], 'no temp file left behind')
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('normalizeSettings keeps only known fields with the right types', () => {
  assert.deepEqual(normalizeSettings({ autoTitle: 'yes', titled: {} }), { autoTitle: false })
  assert.deepEqual(normalizeSettings(null), { autoTitle: false })
})

test('rememberTitle keeps the newest sessions and drops the oldest past the cap', () => {
  let titled = {}
  for (let i = 0; i < TITLED_MAX + 5; i++) titled = rememberTitle(titled, `s${i}`, `title ${i}`)
  const keys = Object.keys(titled)
  assert.equal(keys.length, TITLED_MAX)
  assert.equal(keys[0], 's5', 'the five oldest are gone')
  assert.equal(titled[`s${TITLED_MAX + 4}`], `title ${TITLED_MAX + 4}`)
  const again = rememberTitle(titled, 's5', 'renamed')
  assert.equal(Object.keys(again).at(-1), 's5', 're-titling a session makes it the newest entry')
  assert.equal(again.s5, 'renamed')
})
