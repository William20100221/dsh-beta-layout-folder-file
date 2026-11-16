// Pure helpers for AI titles: no DSH imports, so they run under node --test.

/** Bytes of conversation handed to the model; the rest is summarised as a gap marker. */
export const INPUT_BUDGET = 12000
/** Characters kept from any single turn. */
export const TURN_CLIP = 1500

const textOf = (content) => (Array.isArray(content) ? content.filter((block) => block?.type === 'text').map((block) => block.text) : []).join('\n').trim()

/** The conversation as [{ role, text, seq }]: human prompts and assistant replies only. */
export function conversationOf(events) {
  const out = []
  for (const event of events) {
    if (event.type === 'user/message' && event.data?.source?.kind === 'user') {
      const text = textOf(event.data.content)
      if (text) out.push({ role: 'user', text, seq: event.seq })
    } else if (event.type === 'assistant/message') {
      const text = textOf(event.data?.message?.content)
      if (text) out.push({ role: 'assistant', text, seq: event.seq })
    }
  }
  return out
}

/** Cut at `max` characters without splitting a surrogate pair (emoji, rare CJK). */
export function clip(text, max) {
  if (text.length <= max) return text
  const end = max > 0 && text.charCodeAt(max - 1) >= 0xd800 && text.charCodeAt(max - 1) <= 0xdbff ? max - 1 : max
  return text.slice(0, end) + '…'
}

/**
 * Frame the conversation for the model: the first prompt, the newest turns within the byte budget, and a
 * marker naming how many turns in between were left out. With a `currentTitle` the model is asked to keep
 * it when it still fits, so titles do not churn on every reply.
 */
export function frameConversation(turns, { budget = INPUT_BUDGET, currentTitle } = {}) {
  const items = turns.map((turn) => ({ role: turn.role, text: clip(turn.text, TURN_CLIP) }))
  const kept = []
  let used = 0
  for (let i = items.length - 1; i >= 0; i--) {
    const size = Buffer.byteLength(JSON.stringify(items[i]), 'utf8')
    if (kept.length > 0 && used + size > budget) break
    kept.unshift(items[i])
    used += size
  }
  // `kept` is a suffix of `items`; when the first prompt fell off, put it back with a marker for the gap.
  let framed = kept
  if (kept.length < items.length) {
    const omitted = items.length - kept.length - 1
    framed = [items[0], ...(omitted > 0 ? [{ role: 'system', text: `[${omitted} earlier turns omitted]` }] : []), ...kept]
  }
  const lines = [`Generate the session title from this JSON array of conversation turns:\n${JSON.stringify(framed)}`]
  if (currentTitle) lines.push(`The current title is ${JSON.stringify(currentTitle)}. If it still fits the whole conversation, return it unchanged; otherwise return a better one.`)
  return lines.join('\n')
}

/** First non-empty line, without a Markdown emphasis wrapper or surrounding quotes. */
export function titleFromOutput(text) {
  const line = String(text).split(/\r?\n/u).map((item) => item.trim()).find((item) => item.length > 0) ?? ''
  const match = /^(\*{1,3})(\S(?:.*\S)?)\1$/u.exec(line)
  return (match && !match[2].includes(match[1]) ? match[2] : line).replace(/^["'“”]+|["'“”]+$/gu, '').trim()
}
