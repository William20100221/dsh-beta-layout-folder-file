import { test } from 'node:test'
import assert from 'node:assert/strict'

import { conversationOf, frameConversation, titleFromOutput } from '../lib/title.js'

const user = (seq, text, kind = 'user') => ({ seq, type: 'user/message', data: { source: { kind }, content: [{ type: 'text', text }] } })
const assistant = (seq, text) => ({ seq, type: 'assistant/message', data: { message: { content: [{ type: 'text', text }, { type: 'tool-call' }] } } })

test('conversationOf keeps human prompts and assistant text only', () => {
  const turns = conversationOf([user(1, 'Fix the drag bug'), user(2, 'marker', 'dsh-clear'), assistant(3, 'Done.'), { seq: 4, type: 'tool/result', data: {} }, user(5, '   ')])
  assert.deepEqual(turns, [
    { role: 'user', text: 'Fix the drag bug', seq: 1 },
    { role: 'assistant', text: 'Done.', seq: 3 }
  ])
})

test('frameConversation keeps the first prompt and the newest turns within budget', () => {
  const turns = [{ role: 'user', text: 'first' }, ...Array.from({ length: 50 }, (_, i) => ({ role: i % 2 ? 'user' : 'assistant', text: 'x'.repeat(400) + i }))]
  const framed = frameConversation(turns, 3000)
  const kept = JSON.parse(framed.slice(framed.indexOf('\n') + 1))
  assert.equal(kept[0].text, 'first')
  assert.equal(kept[kept.length - 1].text.endsWith('49'), true)
  assert.ok(kept.length < turns.length)
  assert.ok(Buffer.byteLength(JSON.stringify(kept.slice(1))) <= 3000)
})

test('titleFromOutput takes the first line without wrappers', () => {
  assert.equal(titleFromOutput('\n**Drag bug in folder drop**\nmore'), 'Drag bug in folder drop')
  assert.equal(titleFromOutput('"Quoted title"'), 'Quoted title')
  assert.equal(titleFromOutput('   '), '')
})
