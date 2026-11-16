import { test } from 'node:test'
import assert from 'node:assert/strict'

import { clip, conversationOf, frameConversation, titleFromOutput } from '../src/host/title.js'

const user = (seq, text, kind = 'user') => ({ seq, type: 'user/message', data: { source: { kind }, content: [{ type: 'text', text }] } })
const assistant = (seq, text) => ({ seq, type: 'assistant/message', data: { message: { content: [{ type: 'text', text }, { type: 'tool-call' }] } } })
const framed = (input) => JSON.parse(input.slice(input.indexOf('\n') + 1).split('\nThe current title')[0])

test('conversationOf keeps human prompts and assistant text only', () => {
  const turns = conversationOf([user(1, 'Fix the drag bug'), user(2, 'marker', 'dsh-clear'), assistant(3, 'Done.'), { seq: 4, type: 'tool/result', data: {} }, user(5, '   ')])
  assert.deepEqual(turns, [
    { role: 'user', text: 'Fix the drag bug', seq: 1 },
    { role: 'assistant', text: 'Done.', seq: 3 }
  ])
})

test('frameConversation keeps the first prompt and the newest turns, and marks the gap', () => {
  const turns = [{ role: 'user', text: 'first' }, ...Array.from({ length: 50 }, (_, i) => ({ role: i % 2 ? 'user' : 'assistant', text: 'x'.repeat(400) + i }))]
  const kept = framed(frameConversation(turns, { budget: 3000 }))
  assert.equal(kept[0].text, 'first')
  assert.equal(kept[1].role, 'system')
  assert.match(kept[1].text, /^\[\d+ earlier turns omitted\]$/)
  assert.equal(kept[kept.length - 1].text.endsWith('49'), true)
  assert.equal(Number(kept[1].text.match(/\d+/)[0]) + (kept.length - 1), turns.length, 'first + omitted + tail accounts for every turn')
  const whole = framed(frameConversation(turns.slice(0, 3)))
  assert.equal(whole.length, 3, 'nothing omitted, no marker')
})

test('frameConversation asks to keep a title that still fits', () => {
  const input = frameConversation([{ role: 'user', text: 'hi' }], { currentTitle: 'Greeting' })
  assert.match(input, /current title is "Greeting"/)
  assert.doesNotMatch(frameConversation([{ role: 'user', text: 'hi' }]), /current title/)
})

test('clip never splits a surrogate pair', () => {
  assert.equal(clip('ab😀cd', 3), 'ab…')
  assert.equal(clip('ab😀cd', 4), 'ab😀…')
  assert.equal(clip('short', 10), 'short')
})

test('titleFromOutput takes the first line without wrappers', () => {
  assert.equal(titleFromOutput('\n**Drag bug in folder drop**\nmore'), 'Drag bug in folder drop')
  assert.equal(titleFromOutput('"Quoted title"'), 'Quoted title')
  assert.equal(titleFromOutput('   '), '')
})
