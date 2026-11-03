/**
 * dsh-beta-layout-folder-file, Host half: AI titles for whole conversations.
 * - `/api/dsh-beta-layout` route for the browser: read/write the one setting, generate a title.
 * - With `autoTitle` on, every finished turn (`turn/end`) retitles the session from the whole
 *   conversation, through the same LLM helper DSH's own first-prompt titles use.
 * The sidebar (folders, tree, drag effects, export) lives in lib/client.js.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { executeSessionTitleLlm, resolveSessionTitleLlmConfig } from '@deepseek-ai/dsh-session-title-llm'

import { conversationOf, frameConversation, titleFromOutput } from './lib/title.js'

export const name = 'beta-layout'
export const inject = ['connection', 'sessions', 'sessionTitle', 'llm']

const ROUTE = '/api/dsh-beta-layout'
const PROVIDER = 'dsh-beta-layout-folder-file'
const LLM = resolveSessionTitleLlmConfig({ maxInputBytes: 24000, maxOutputTokens: 64, timeoutMs: 30000 })
const SYSTEM = [
  'Create a concise title for an AI coding-assistant session from the supplied conversation.',
  'Return only the title on one line, in plain natural language, with no quotes, prefix, explanation, Markdown, XML, or code.',
  'Use the language of the conversation and name what it is about, not how it went.',
  'Aim for about 6 words in non-CJK languages or 12 CJK characters.'
].join('\n')

const settingsPath = () => join(process.env.DSH_HOME || join(homedir(), '.dsh'), 'dsh-beta-layout-folder-file.json')

function readSettings() {
  try {
    const value = JSON.parse(readFileSync(settingsPath(), 'utf8'))
    return { autoTitle: value?.autoTitle === true }
  } catch {
    return { autoTitle: false }
  }
}

function writeSettings(settings) {
  mkdirSync(join(settingsPath(), '..'), { recursive: true })
  writeFileSync(settingsPath(), JSON.stringify(settings, null, 2))
}

export function apply(ctx) {
  let settings = readSettings()
  const inflight = new Map()

  async function generate(session, signal) {
    const turns = conversationOf(session.snapshotEvents())
    if (turns.length === 0) throw new Error('the session has no messages yet')
    const header = session.requestHeader()?.config
    if (!header?.provider || !header?.model) throw new Error('send a message in this session first, so a model route is known')
    const response = await executeSessionTitleLlm(ctx, LLM, { session, signal, route: { provider: header.provider, model: header.model } }, PROVIDER, {
      system: SYSTEM,
      input: frameConversation(turns),
      messageSeqs: turns.map((turn) => turn.seq),
      selectReasoningEffort: (model) => model.reasoning?.efforts[0]?.id
    })
    if (response.finish.kind !== 'stop') throw new Error(`title generation finished with ${response.finish.kind}`)
    const title = titleFromOutput(response.blocks.filter((block) => block.type === 'text').map((block) => block.text).join(' '))
    if (title.length === 0) throw new Error('the model returned no title')
    ctx.sessionTitle.rename(session, title)
    return title
  }

  /** One generation per session at a time; a request during one waits for it and runs again after. */
  function generateOnce(session) {
    const running = inflight.get(session.id)
    if (running) return running
    const controller = new AbortController()
    const work = generate(session, controller.signal).finally(() => inflight.delete(session.id))
    inflight.set(session.id, work)
    return work
  }

  const endpoints = {
    'settings.get': async () => settings,
    'settings.set': async (payload) => {
      settings = { autoTitle: payload?.autoTitle === true }
      writeSettings(settings)
      return settings
    },
    'title.generate': async (payload) => {
      const session = ctx.sessions.get(String(payload?.sessionId ?? ''))
      if (session === undefined) throw new Error('the session is not open')
      return { title: await generateOnce(session) }
    }
  }

  // One exact Fetch route on Connection (the registry DSH's own session export uses): POST { method, payload }.
  const route = {
    path: ROUTE,
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: async (request) => {
      let body = {}
      try {
        body = await request.json()
      } catch {}
      const run = Object.hasOwn(endpoints, body?.method) ? endpoints[body.method] : undefined
      const result = run === undefined ? { ok: false, error: { code: 'bad-request', message: `unknown method ${String(body?.method)}` } } : await run(body.payload ?? {}).then(
        (value) => ({ ok: true, value }),
        (error) => ({ ok: false, error: { code: 'internal', message: error instanceof Error ? error.message : String(error) } })
      )
      return new Response(JSON.stringify(result), { status: 200, headers: { 'content-type': 'application/json' } })
    }
  }
  Reflect.get(ctx, 'connection').fetch.register(route)

  // Auto mode: retitle after each finished turn of a user-facing session.
  const timers = new Map()
  ctx.on('session/event', (session, event) => {
    if (!settings.autoTitle || event.type !== 'turn/end' || session.meta?.origin === 'subagent') return
    clearTimeout(timers.get(session.id))
    timers.set(
      session.id,
      setTimeout(() => {
        timers.delete(session.id)
        if (ctx.sessions.get(session.id) !== session) return
        generateOnce(session).catch((error) => ctx.logger?.warn?.('[dsh-beta-layout] auto title failed:', error))
      }, 1500)
    )
  })
  ctx.effect(() => () => timers.forEach((timer) => clearTimeout(timer)), 'dsh-beta-layout: timers')
}
