import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// The one test of the loader format: lib/client.js must be what scripts/build.js produces from src/client/,
// and it must load the way DSH's shell loads it, with only the shared modules available.

test('lib/client.js is built from src/client', () => {
  execFileSync(process.execPath, [new URL('../scripts/build.js', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'), '--check'], { stdio: 'pipe' })
})

test('the bundle registers with the module loader and exports the plugin body', () => {
  let registration
  globalThis.window = { __ModuleLoader__: { load: (r) => (registration = r) } }
  new Function(readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8'))()
  assert.equal(registration.id, 'dsh-beta-layout-folder-file')
  const shared = { react: { createElement: () => null, useState: () => [], useEffect: () => {} }, '@deepseek-ai/dsh-client-ui-primitives': {} }
  const plugin = registration.factory((name) => {
    assert.ok(name in shared, `only shared modules may be required (got ${name})`)
    return shared[name]
  })
  assert.deepEqual(plugin.inject, ['locale', 'workspaces', 'sessions', 'slots', 'contextMenus'])
  assert.equal(typeof plugin.apply, 'function')
})
