/**
 * dsh-beta-layout-folder-file, Host half: AI titles for whole conversations.
 * - One Connection route, POST /api/dsh-beta-layout { method, payload }: the setting, and title generation
 *   for the ⋯ menu. The browser half calls it document-relative, cookie-authenticated like DSH's export.
 * - With `autoTitle` on, every finished turn (`turn/end`) of a user-facing session retitles it from the whole
 *   conversation, through the same LLM helper DSH's own first-message titles use.
 * Why not a title provider: DSH's title service seats exactly one provider and the base bundle already fills
 * it (first-prompt). Why `rename()`: it pins the title, which is the feature (DSH's one-off title must not
 * replace a title made from the whole conversation). DSH records a plugin rename and a user rename the same
 * way, so the last title this plugin set is remembered on disk; a session whose title differs from it was
 * renamed by the user and is left alone.
 * The sidebar (folders, tree, drag effects, menus) lives in lib/client.js, built from src/client/.
 */

import { executeSessionTitleLlm, resolveSessionTitleLlmConfig } from '@deepseek-ai/dsh-session-title-llm'

import { normalizeSettings, readState, rememberTitle, settingsPath, writeState } from './src/host/settings.js'
import { conversationOf, frameConversation, titleFromOutput } from './src/host/title.js'

export const name = 'beta-layout'
export const inject = ['connection', 'sessions', 'sessionTitle', 'llm']

const ROUTE = '/api/dsh-beta-layout'
const PROVIDER = 'dsh-beta-layout-folder-file'
const LIMITS = {
  maxInputBytes: 24000, // the framed conversation (title.js keeps it near 12 KB)
  maxOutputTokens: 64, // a title
  timeoutMs: 30000,
  debounceMs: 1500 // after turn/end, so a quick follow-up turn does not title twice
}
const LLM = resolveSessionTitleLlmConfig({ maxInputBytes: LIMITS.maxInputBytes, maxOutputTokens: LIMITS.maxOutputTokens, timeoutMs: LIMITS.timeoutMs })
const SYSTEM = [
  'Create a concise title for an AI coding-assistant session from the supplied conversation.',
  'Return only the title on one line, in plain natural language, with no quotes, prefix, explanation, Markdown, XML, or code.',
  'Use the language of the conversation and name what it is about, not how it went.',
  'Aim for about 6 words in non-CJK languages or 12 CJK characters.'
].join('\n')

const ok = (value) => ({ ok: true, value })
const fail = (code, message) => ({ ok: false, error: { code, message } })
const isAbort = (error) => error?.name === 'AbortError' || error?.code === 'ABORT_ERR'

export function apply(ctx) {
  const path = settingsPath()
  let state = readState(path)
  const inflight = new Map() // sessionId → { work, controller, rerun }
  const timers = new Map()
  const isSubagent = (session) => session.header?.origin === 'subagent'
  const isLive = (session) => ctx.sessions.get(session.id) === session

  /** A title the user typed: user-sourced and not the one this plugin set last. */
  const manuallyTitled = (session) => {
    const current = ctx.sessionTitle.get(session)
    return current?.source?.kind === 'user' && current.title !== state.titled[session.id]
  }

  async function generate(session, signal) {
    const turns = conversationOf(session.snapshotEvents())
    if (turns.length === 0) throw new Error('the session has no messages yet')
    const route = session.requestHeader()?.config
    if (!route?.provider || !route?.model) throw new Error('send a message in this session first, so a model route is known')
    const before = ctx.sessionTitle.get(session)
    const response = await executeSessionTitleLlm(ctx, LLM, { session, signal, route: { provider: route.provider, model: route.model } }, PROVIDER, {
      system: SYSTEM,
      input: frameConversation(turns, { currentTitle: before?.title }),
      messageSeqs: turns.map((turn) => turn.seq),
      selectReasoningEffort: (model) => model.reasoning?.efforts[0]?.id
    })
    if (response.finish.kind !== 'stop') throw new Error(`title generation finished with ${response.finish.kind}`)
    const title = titleFromOutput(response.blocks.filter((block) => block.type === 'text').map((block) => block.text).join(' '))
    if (title.length === 0) throw new Error('the model returned no title')
    if (!isLive(session)) throw new Error('the session was closed meanwhile')
    // The user may have typed a title while the model was thinking: theirs wins.
    const now = ctx.sessionTitle.get(session)
    if (now?.source?.kind === 'user' && now.title !== before?.title && now.title !== state.titled[session.id]) throw new Error('the session was renamed meanwhile')
    // DSH normalises what it stores (whitespace, length); remember that form so the two compare equal later.
    const accepted = title === now?.title ? now : ctx.sessionTitle.rename(session, title)
    const stored = accepted?.title ?? title
    state = { ...state, titled: rememberTitle(state.titled, session.id, stored) }
    writeState(path, state)
    return stored
  }

  /** One generation per session at a time; requests during one make it run again until none is pending. */
  function generateOnce(session) {
    const running = inflight.get(session.id)
    if (running !== undefined) {
      running.rerun = true
      return running.work
    }
    const entry = { controller: new AbortController(), rerun: false }
    entry.work = (async () => {
      let title
      do {
        entry.rerun = false
        title = await generate(session, entry.controller.signal)
      } while (entry.rerun)
      return title
    })().finally(() => {
      if (inflight.get(session.id) === entry) inflight.delete(session.id)
    })
    inflight.set(session.id, entry)
    return entry.work
  }

  const endpoints = {
    'settings.get': async () => normalizeSettings(state),
    'settings.set': async (payload) => {
      const next = { ...state, ...normalizeSettings(payload) }
      writeState(path, next)
      state = next
      return normalizeSettings(state)
    },
    'title.generate': async (payload) => {
      const session = ctx.sessions.get(String(payload?.sessionId ?? ''))
      if (session === undefined) throw new Error('the session is not open')
      if (isSubagent(session)) throw new Error('subagent sessions keep their own titles')
      return { title: await generateOnce(session) }
    }
  }

  ctx.connection.fetch.register({
    path: ROUTE,
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: async (request) => {
      let body = {}
      try {
        body = await request.json()
      } catch {}
      const run = Object.hasOwn(endpoints, body?.method) ? endpoints[body.method] : undefined
      const result = run === undefined ? fail('bad-request', `unknown method ${String(body?.method)}`) : await run(body.payload ?? {}).then(ok, (error) => fail('internal', error instanceof Error ? error.message : String(error)))
      return new Response(JSON.stringify(result), { status: 200, headers: { 'content-type': 'application/json' } })
    }
  })

  ctx.on('session/event', (session, event) => {
    if (!state.autoTitle || event.type !== 'turn/end' || isSubagent(session)) return
    clearTimeout(timers.get(session.id))
    timers.set(
      session.id,
      setTimeout(() => {
        timers.delete(session.id)
        if (!state.autoTitle || !isLive(session) || manuallyTitled(session)) return
        generateOnce(session).catch((error) => {
          if (isLive(session) && !isAbort(error)) ctx.logger?.warn?.('[dsh-beta-layout] auto title failed:', error)
        })
      }, LIMITS.debounceMs)
    )
  })
  ctx.on('session/disposed', (session) => {
    clearTimeout(timers.get(session.id))
    timers.delete(session.id)
    inflight.get(session.id)?.controller.abort()
  })
  ctx.effect(
    () => () => {
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
      for (const entry of inflight.values()) entry.controller.abort()
    },
    'dsh-beta-layout: titles'
  )
}
