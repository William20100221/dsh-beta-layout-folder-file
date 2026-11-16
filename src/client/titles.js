import { NS } from './constants.js'
import { downloadSession, rpc } from './host.js'
import { createSignal } from './store.js'

/**
 * Session actions behind the ⋯ menu: Generate title (through the host half) and Export as ZIP (DSH's own
 * route). `running` is a snapshot store of session ids being titled, so the menu can show progress.
 */
export function createTitles({ doc, sessions, notify, t }) {
  const running = createSignal(new Set())
  const mark = (sessionId, on) => {
    const next = new Set(running.get())
    if (on) next.add(sessionId)
    else next.delete(sessionId)
    running.set(next)
  }

  function generate(sessionId) {
    if (running.get().has(sessionId)) return Promise.resolve()
    mark(sessionId, true)
    notify(t('generating'), true)
    // `using` keeps the session loaded on the Host while the title is generated; it returns the callback's value.
    return sessions
      .using(sessionId, { source: 'workspaceOperation' }, () => rpc('title.generate', { sessionId }))
      .then(
        (value) => notify(`${t('titled')}: ${value.title}`, true),
        (error) => {
          console.warn(`[${NS}] title generation failed:`, error)
          notify(`${t('titleFailed')}: ${error instanceof Error ? error.message : String(error)}`, false)
        }
      )
      .finally(() => mark(sessionId, false))
  }

  return {
    running,
    generate,
    isRunning: (sessionId) => running.get().has(sessionId),
    exportZip: (sessionId) => downloadSession(doc, sessionId)
  }
}
