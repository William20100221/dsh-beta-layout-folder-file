/** Pure helpers for AI titles: no DSH imports, so they run under node --test. */

const INPUT_BUDGET = 12000

const textOf = (content) => (Array.isArray(content) ? content.filter((block) => block?.type === 'text').map((block) => block.text) : []).join('\n').trim()

/** The conversation as [{ role, text, seq }], human prompts and assistant replies only. */
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

/** Keep the first prompt and the most recent exchanges within the byte budget; long texts are clipped. */
export function frameConversation(turns, budget = INPUT_BUDGET) {
  const clip = (text, max) => (text.length > max ? text.slice(0, max) + '…' : text)
  const items = turns.map((turn) => ({ role: turn.role, text: clip(turn.text, 1500) }))
  const kept = []
  let used = 0
  for (let i = items.length - 1; i >= 0; i--) {
    const size = Buffer.byteLength(JSON.stringify(items[i]), 'utf8')
    if (kept.length > 0 && used + size > budget) break
    kept.unshift(items[i])
    used += size
  }
  if (items.length > 0 && kept[0] !== items[0] && used + Buffer.byteLength(JSON.stringify(items[0]), 'utf8') <= budget * 1.2) kept.unshift(items[0])
  return `Generate the session title from this JSON array of conversation turns:\n${JSON.stringify(kept)}`
}

/** First non-empty line, without a Markdown emphasis wrapper. */
export function titleFromOutput(text) {
  const line = String(text).split(/\r?\n/u).map((item) => item.trim()).find((item) => item.length > 0) ?? ''
  const match = /^(\*{1,3})(\S(?:.*\S)?)\1$/u.exec(line)
  return (match && !match[2].includes(match[1]) ? match[2] : line).replace(/^["'“”]+|["'“”]+$/gu, '').trim()
}

