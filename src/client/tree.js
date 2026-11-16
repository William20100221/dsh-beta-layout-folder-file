import { SEL, sessionIdOf, sessionWrappers } from './dsh-dom.js'
import { SVG } from './icons.js'
import { treeOrder } from './model.js'
import { toggleAttr } from './util.js'

/**
 * Nest forked sessions under their source inside one workspace section. DSH lists them flat; this moves
 * each fork's wrapper right after its source, indents it with a connector line, and gives the source a
 * caret button that folds its forks (showing their count while folded). Rows are never moved mid-drag.
 */
export function nestForks(section, { byId, collapsed, isDragging, t, onToggle }) {
  const wrappers = sessionWrappers(section)
  if (wrappers.length === 0) return
  const byRowId = new Map(wrappers.map((entry) => [sessionIdOf(entry.row), entry]))
  const order = treeOrder([...byRowId.keys()], (id) => byId[id]?.parentId)
  const hiddenUnder = new Set()
  let ref = wrappers[0].el.previousSibling
  for (const node of order) {
    const { el, row } = byRowId.get(node.id)
    if (!isDragging) {
      const next = ref ? ref.nextSibling : section.firstChild
      if (next !== el) section.insertBefore(el, next)
    }
    ref = el
    const parent = byId[node.id]?.parentId
    const hidden = node.depth > 0 && (collapsed[parent] === true || hiddenUnder.has(parent))
    if (hidden) hiddenUnder.add(node.id)
    toggleAttr(el, 'data-dshcl-hidden', hidden)
    toggleAttr(row, 'data-dshcl-depth', node.depth > 0, String(node.depth))
    if (row.style.getPropertyValue('--dshcl-depth') !== String(node.depth)) row.style.setProperty('--dshcl-depth', String(node.depth))
    toggleAttr(row, 'data-dshcl-last', node.last)

    let line = row.querySelector(':scope > .dshcl-tree-line')
    if (node.depth > 0 && line === null) {
      line = document.createElement('span')
      line.className = 'dshcl-tree-line'
      line.setAttribute('aria-hidden', 'true')
      row.prepend(line)
    } else if (node.depth === 0 && line !== null) line.remove()

    let toggle = row.querySelector('.dshcl-tree-toggle')
    if (node.childCount > 0 && toggle === null) {
      toggle = document.createElement('button')
      toggle.type = 'button'
      toggle.className = 'dshcl-tree-toggle'
      toggle.innerHTML = SVG.caret
      // The row opens the session on click/Enter and starts a drag on press: keep the caret's own events to itself.
      for (const type of ['pointerdown', 'mousedown', 'dblclick']) toggle.addEventListener(type, (event) => event.stopPropagation())
      toggle.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') event.stopPropagation()
      })
      toggle.addEventListener('click', (event) => {
        event.stopPropagation()
        event.preventDefault()
        onToggle(node.id)
      })
      const title = row.querySelector(SEL.title)
      if (title !== null) title.after(toggle)
      else row.appendChild(toggle)
    } else if (node.childCount === 0 && toggle !== null) toggle.remove()
    if (toggle !== null) {
      const folded = collapsed[node.id] === true
      toggle.setAttribute('aria-expanded', String(!folded))
      toggle.setAttribute('aria-label', `${node.childCount} ${t('forks')}`)
      toggle.title = `${node.childCount} ${t('forks')}`
      toggleAttr(toggle, 'data-count', true, String(node.childCount))
    }
  }
}
