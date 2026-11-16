import { LAYOUT, TIMING } from './constants.js'
import { SEL, isSessionRow, isWorkspaceRow, rowOfWrapper, scrollerOf, sectionOf, sessionIdOf, textOf, workspaceIdOf, wrapperOf } from './dsh-dom.js'
import { folderOf } from './model.js'
import { halfOf, nextSiblingSkipping } from './util.js'

/**
 * Claude-style effects on DSH's native HTML5 drag, plus the folder logic DSH knows nothing about.
 * Capture-phase listeners on the document see every drag event before DSH does; DSH still decides where a
 * workspace or session row drops, this layer only mirrors that with a dashed slot and tells the actions
 * which folder the drop landed in. Folder headers (drag to reorder, drop target for workspaces) are
 * entirely this layer's. Nested rows of the Workspace Tree view are left to DSH.
 *   - pill drag image, dimmed list, the lifted row collapsing (CSS, see styles.js)
 *   - slot: a row-sized dashed gap inserted where the drop will land, so rows slide apart
 *   - spring-loaded folders: a collapsed folder opens after a short hover
 *   - auto-scroll near the list's top and bottom edges
 */
export function createDrag({ doc, win, getList, folders, actions, store, orderSync, labelOf }) {
  let drag = null // { kind: 'workspace' | 'session' | 'folder', id, el, over }
  let slot = null
  let overBlock = null
  let spring = null
  let scroller = null
  let autoScroll = 0
  let frame = 0

  const ghost = doc.createElement('div')
  ghost.className = 'dshcl-ghost'
  ghost.setAttribute('aria-hidden', 'true')
  doc.body.appendChild(ghost)
  const setImage = (event) => {
    try {
      event.dataTransfer.setDragImage(ghost, ...LAYOUT.DRAG_IMAGE_OFFSET)
    } catch {}
  }

  // ---- the slot
  function placeSlot(parent, before) {
    if (slot === null) {
      slot = doc.createElement('div')
      slot.className = 'dshcl-slot'
      slot.setAttribute('aria-hidden', 'true')
    }
    if (before === slot) before = slot.nextSibling
    if (slot.parentElement === parent && slot.nextSibling === before) return
    parent.insertBefore(slot, before)
    slot.removeAttribute('data-open')
    void slot.offsetHeight
    slot.setAttribute('data-open', '')
  }
  const clearSlot = () => slot?.remove()

  function setOver(block) {
    if (overBlock !== null && overBlock !== block) overBlock.removeAttribute('data-over')
    overBlock = block
    if (block !== null) block.setAttribute('data-over', '')
  }

  // ---- spring-loaded folders
  function springLoad(folderId) {
    if (!(actions.folder(folderId)?.collapsed ?? false)) return clearSpring()
    if (spring?.folderId === folderId) return
    clearSpring()
    spring = {
      folderId,
      timer: setTimeout(() => {
        spring = null
        actions.setFolderCollapsed(folderId, false)
      }, TIMING.SPRING_MS)
    }
  }
  function clearSpring() {
    if (spring !== null) clearTimeout(spring.timer)
    spring = null
  }

  // ---- auto-scroll
  /** Scroll speed for a pointer in the band along the list's top or bottom edge, 0 beside the list. */
  function scrollDelta(event) {
    if (scroller === null) return 0
    const rect = scroller.getBoundingClientRect()
    if (event.clientX < rect.left || event.clientX > rect.right) return 0
    const band = LAYOUT.AUTOSCROLL_BAND_PX
    if (event.clientY < rect.top + band) return -Math.min(LAYOUT.AUTOSCROLL_MAX_PX, (band - (event.clientY - rect.top)) * 0.4)
    if (event.clientY > rect.bottom - band) return Math.min(LAYOUT.AUTOSCROLL_MAX_PX, (band - (rect.bottom - event.clientY)) * 0.4)
    return 0
  }
  const tick = () => {
    if (drag === null) return
    if (autoScroll !== 0 && scroller !== null) scroller.scrollTop += autoScroll
    frame = win.requestAnimationFrame(tick)
  }

  // ---- lifecycle
  function beginDrag(event, info, label, group) {
    drag = info
    ghost.textContent = label
    if (group) ghost.setAttribute('data-group', '')
    else ghost.removeAttribute('data-group')
    setImage(event)
    doc.body.classList.add('dshcl-dragging')
    const list = getList()
    scroller = list === null ? null : scrollerOf(list, win)
    autoScroll = 0
    frame = win.requestAnimationFrame(tick)
    // Collapsing the lifted row inside dragstart would cancel the drag, so it waits a tick.
    setTimeout(() => {
      if (drag === info) info.el.setAttribute('data-dshcl-source', '')
    }, 0)
  }

  function endDrag() {
    drag = null
    setOver(null)
    clearSlot()
    clearSpring()
    win.cancelAnimationFrame(frame)
    autoScroll = 0
    ghost.textContent = ''
    doc.body.classList.remove('dshcl-dragging')
    for (const el of doc.querySelectorAll('[data-dshcl-source]')) el.removeAttribute('data-dshcl-source')
    orderSync.normalizeSoon()
  }

  // ---- folder blocks: this layer's own drop targets
  /** A block takes workspaces, and other folders (to reorder). */
  const blockAccepts = (folderId) => drag !== null && (drag.kind === 'workspace' || (drag.kind === 'folder' && drag.id !== folderId))

  function hoverBlock(event, block) {
    autoScroll = scrollDelta(event)
    const folderId = block.dataset.dshclFolder
    if (!blockAccepts(folderId)) return
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'move'
    if (drag.kind === 'folder') {
      setOver(null)
      const half = halfOf(event, block)
      drag.over = { folderId, half }
      placeSlot(block.parentElement, half === 'before' ? block : block.nextSibling)
    } else {
      clearSlot()
      setOver(block)
      springLoad(folderId)
    }
  }

  function dropOnBlock(event, block) {
    const folderId = block.dataset.dshclFolder
    if (!blockAccepts(folderId)) return
    event.preventDefault()
    event.stopPropagation()
    if (drag.kind === 'folder') actions.reorderFolder(drag.id, folderId, halfOf(event, block))
    else actions.moveToFolder(drag.id, folderId, { id: drag.id, before: null })
    endDrag()
  }

  // ---- document listeners (capture: before DSH's own handlers)
  const onDragStart = (event) => {
    const target = event.target instanceof Element ? event.target : null
    if (target === null) return
    if (target.closest('.dshcl-rename') !== null) return event.preventDefault() // selecting text in a rename is not a drag
    const head = target.closest('.dshcl-folder')
    if (head !== null) {
      const folderId = folders.folderIdOf(head)
      const folder = folderId === undefined ? undefined : actions.folder(folderId)
      if (folder === undefined) return
      event.dataTransfer.setData('text/plain', 'dshcl-folder:' + folderId)
      beginDrag(event, { kind: 'folder', id: folderId, el: head }, folder.title, true)
      return
    }
    const list = getList()
    const row = target.closest(SEL.anyRow)
    if (list === null || row === null || !list.contains(row)) return
    if (isWorkspaceRow(row)) {
      const id = workspaceIdOf(row)
      if (id !== '' && row.closest(SEL.group) === null) beginDrag(event, { kind: 'workspace', id, el: row }, labelOf('workspace', id) ?? textOf(row), true)
    } else if (isSessionRow(row)) beginDrag(event, { kind: 'session', id: sessionIdOf(row), el: row }, labelOf('session', sessionIdOf(row)) ?? textOf(row), false)
  }
  /** DSH's own dragstart handler runs after the capture listener and sets a row clone as the image: the pill goes back on top. */
  const onDragStartAfterDsh = (event) => {
    if (drag !== null && !event.defaultPrevented) setImage(event)
  }

  /** Mirror DSH's drop position (top or bottom half of the target) with the slot. */
  const onDragOver = (event) => {
    if (!(event.target instanceof Element)) return
    const block = event.target.closest('.dshcl-block')
    if (block !== null) return hoverBlock(event, block)
    if (drag === null) return
    setOver(null)
    clearSpring()
    autoScroll = scrollDelta(event)
    const list = getList()
    if (list === null) return
    if (drag.kind === 'folder') return clearSlot()
    if (drag.kind === 'session') {
      const row = event.target.closest(SEL.sessionRow)
      // Forks sit under their source here but DSH orders by its own flat list: no slot over them.
      if (row === null || row === drag.el || row.hasAttribute('data-dshcl-depth')) return
      const wrapper = wrapperOf(row)
      const section = wrapper.parentElement
      if (section === null || !section.contains(drag.el)) return // DSH only reorders within one workspace
      let after = wrapper.nextElementSibling // "after" a source means after its forks too
      while (after !== null && (after === slot || rowOfWrapper(after)?.hasAttribute('data-dshcl-depth'))) after = after.nextElementSibling
      placeSlot(section, halfOf(event, row) === 'before' ? wrapper : after)
      return
    }
    const section = sectionOf(event.target, list)
    if (section === null || section.contains(drag.el)) return
    const half = halfOf(event, section)
    drag.over = { section, half }
    placeSlot(list, half === 'before' ? section : section.nextSibling)
  }
  const onDragLeave = (event) => {
    if (event.relatedTarget === null) autoScroll = 0 // the pointer left the window
  }

  /**
   * A workspace dropped among a folder's workspaces joins that folder; among loose ones, it leaves.
   * The slot takes no pointer events, so a drop on it lands on the list: use what was hovered last.
   */
  const onDrop = (event) => {
    if (!(event.target instanceof Element)) return
    const block = event.target.closest('.dshcl-block')
    if (block !== null) return dropOnBlock(event, block)
    if (drag === null) return
    if (event.target.closest(SEL.anyRow) === null) event.preventDefault()
    if (drag.kind === 'folder') {
      if (drag.over) actions.reorderFolder(drag.id, drag.over.folderId, drag.over.half)
      return
    }
    if (drag.kind !== 'workspace') return
    const list = getList()
    if (list === null) return
    const section = sectionOf(event.target, list) ?? drag.over?.section ?? null
    const row = section?.querySelector(SEL.workspaceRow) ?? null
    if (row === null) return
    const target = workspaceIdOf(row)
    if (target === drag.id) return
    // Same rule as DSH's drop: before the target, or before whatever follows it.
    const half = drag.over?.section === section ? drag.over.half : halfOf(event, section)
    const nextRow = half === 'before' ? row : (nextSiblingSkipping(section, 'dshcl-slot')?.querySelector(SEL.workspaceRow) ?? null)
    const before = nextRow === null ? null : workspaceIdOf(nextRow)
    actions.moveToFolder(drag.id, folderOf(store.get(), target)?.id ?? null, { id: drag.id, before: before === '' ? null : before })
  }

  const onDragEnd = () => {
    if (drag !== null) endDrag()
  }

  doc.addEventListener('dragstart', onDragStart, true)
  doc.addEventListener('dragstart', onDragStartAfterDsh)
  doc.addEventListener('dragenter', onDragOver, true)
  doc.addEventListener('dragover', onDragOver, true)
  doc.addEventListener('dragleave', onDragLeave, true)
  doc.addEventListener('drop', onDrop, true)
  doc.addEventListener('dragend', onDragEnd, true)

  return {
    isDragging: () => drag !== null,
    dispose: () => {
      if (drag !== null) endDrag()
      doc.removeEventListener('dragstart', onDragStart, true)
      doc.removeEventListener('dragstart', onDragStartAfterDsh)
      doc.removeEventListener('dragenter', onDragOver, true)
      doc.removeEventListener('dragover', onDragOver, true)
      doc.removeEventListener('dragleave', onDragLeave, true)
      doc.removeEventListener('drop', onDrop, true)
      doc.removeEventListener('dragend', onDragEnd, true)
      ghost.remove()
    }
  }
}
