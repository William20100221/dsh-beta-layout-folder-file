import { ROUTE } from './constants.js'

// Calls to the Host half and to DSH's own routes. Both are document-relative and cookie-authenticated,
// the way DSH's session export works.

/** POST { method, payload } to index.js; resolves with the value, rejects with the Host's message. */
export function rpc(method, payload) {
  return fetch(ROUTE, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ method, payload: payload ?? {} })
  })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json()
    })
    .then((result) => {
      if (!result || result.ok !== true) throw new Error(result?.error?.message ?? 'request failed')
      return result.value
    })
}

/** DSH's own session export route (dsh-session-log-export): the browser downloads the ZIP. */
export function downloadSession(doc, sessionId) {
  const a = doc.createElement('a')
  a.href = `api/session.export?sessionId=${encodeURIComponent(sessionId)}&includeDescendants=true`
  a.download = ''
  doc.body.appendChild(a)
  a.click()
  a.remove()
}
