import { isTyping } from './util.js'

/**
 * Arrow keys walk the list: folder headers and DSH's focusable rows (session rows have tabindex; workspace
 * rows do not, in DSH 0.2.2). Enter, F2, Delete and Left/Right on a folder header are handled by folders.js.
 * DSH's own list has no arrow-key navigation, so nothing is overridden.
 */
export function createKeyboard({ doc, getList }) {
  const FOCUSABLE = '.dshcl-folder, [data-row-key][tabindex]'
  const visibleRows = (list) => [...list.querySelectorAll(FOCUSABLE)].filter((el) => el.closest('[data-dshcl-hidden]') === null && el.offsetParent !== null)

  const onKeyDown = (event) => {
    if (isTyping(event) || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    const list = getList()
    const active = doc.activeElement
    if (list === null || !(active instanceof Element) || !list.contains(active)) return
    const current = active.closest(FOCUSABLE)
    if (current === null) return
    const rows = visibleRows(list)
    const at = rows.indexOf(current)
    if (at < 0) return
    const next = event.key === 'ArrowDown' ? rows[at + 1] : event.key === 'ArrowUp' ? rows[at - 1] : event.key === 'Home' ? rows[0] : rows[rows.length - 1]
    if (next === undefined || next === current) return
    event.preventDefault()
    event.stopPropagation()
    next.focus()
    next.scrollIntoView?.({ block: 'nearest' })
  }
  doc.addEventListener('keydown', onKeyDown)
  return { dispose: () => doc.removeEventListener('keydown', onKeyDown) }
}
