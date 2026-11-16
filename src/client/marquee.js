import { LAYOUT, TIMING } from './constants.js'
import { SEL } from './dsh-dom.js'
import { reducedMotion, toggleAttr } from './util.js'

/**
 * Scrolling titles. DSH scrolls a clipped session title to its end on hover and stops there; from that
 * point this keeps it moving: pause, scroll back, pause, forward again, for a couple of round trips, then
 * rest at the start so the ellipsis returns. Keyboard focus and workspace rows (which DSH never scrolls)
 * get the same scroll. Leaving the row always rests the title, the way DSH's own pointer-leave does.
 */
export function createMarquee({ doc, win }) {
  let marquee = null // { row, title, frame }

  const placeTitle = (title, left, range) => {
    title.scrollLeft = left
    toggleAttr(title, 'data-scrolled', left > 0)
    toggleAttr(title, 'data-clipped', left < range)
  }
  const restTitle = (title) => {
    title.scrollLeft = 0
    title.removeAttribute('data-scrolled')
    title.removeAttribute('data-clipped')
  }
  const stop = () => {
    if (marquee === null) return
    win.cancelAnimationFrame(marquee.frame)
    restTitle(marquee.title)
    marquee = null
  }

  function start(row) {
    if (marquee?.row === row) return
    stop()
    const title = row.querySelector(SEL.title)
    if (title === null || reducedMotion(win)) return
    const range = title.scrollWidth - title.clientWidth
    if (range <= LAYOUT.MARQUEE_MIN_RANGE_PX) return
    let phase = 'wait' // wait: let DSH's own scroll run to the end, or take over if it never starts
    let pos = 0
    let dir = 1
    let prev = 0
    let holdUntil = 0
    let legs = 0
    const startedAt = win.performance.now()
    const step = (now) => {
      if (marquee?.row !== row) return
      if (phase === 'wait') {
        if (title.scrollLeft >= range - 1) {
          phase = 'hold'
          pos = range
          dir = -1
          holdUntil = now + TIMING.MARQUEE_HOLD_MS
        } else if (title.scrollLeft < 1 && now - startedAt > 400) {
          phase = 'move'
          prev = now
        }
      } else if (phase === 'hold') {
        if (now >= holdUntil) {
          phase = 'move'
          prev = now
        }
      } else {
        pos = Math.max(0, Math.min(range, pos + (now - prev) * TIMING.MARQUEE_PX_PER_MS * dir))
        prev = now
        placeTitle(title, pos, range)
        if (pos === 0 || pos === range) {
          legs += 1
          if (pos === 0 && legs >= LAYOUT.MARQUEE_ROUND_TRIPS * 2) return stop()
          dir = -dir
          phase = 'hold'
          holdUntil = now + TIMING.MARQUEE_HOLD_MS
        }
      }
      marquee.frame = win.requestAnimationFrame(step)
    }
    marquee = { row, title, frame: win.requestAnimationFrame(step) }
  }

  const rowOf = (event) => (event.target instanceof Element ? event.target.closest(SEL.anyRow) : null)
  const leaves = (event) => marquee !== null && !(event.relatedTarget instanceof Element && marquee.row.contains(event.relatedTarget))
  const onPointerOver = (event) => {
    if (event.pointerType === 'touch') return
    const row = rowOf(event)
    if (row !== null) start(row)
  }
  const onPointerOut = (event) => {
    if (leaves(event)) stop()
  }
  const onFocusIn = (event) => {
    const row = rowOf(event)
    if (row !== null) start(row)
  }
  const onFocusOut = (event) => {
    if (leaves(event)) stop()
  }
  doc.addEventListener('pointerover', onPointerOver, true)
  doc.addEventListener('pointerout', onPointerOut, true)
  doc.addEventListener('focusin', onFocusIn, true)
  doc.addEventListener('focusout', onFocusOut, true)

  return {
    stop,
    dispose: () => {
      stop()
      doc.removeEventListener('pointerover', onPointerOver, true)
      doc.removeEventListener('pointerout', onPointerOut, true)
      doc.removeEventListener('focusin', onFocusIn, true)
      doc.removeEventListener('focusout', onFocusOut, true)
    }
  }
}
