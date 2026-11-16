import { SVG } from './icons.js'
import { splitIcon } from './model.js'
import { nextSiblingSkipping, toggleAttr } from './util.js'

/**
 * Folder headers inside DSH's list. Each folder gets one block:
 *   <div class="dshcl-block" role="none" data-dshcl-folder=ID>
 *     <div class="dshcl-folder" role="treeitem" tabindex="0" draggable>icon · title · caret · count · [+] [⋯]</div>
 *     <div class="dshcl-hint">Drag workspaces here</div>          (only while the folder is empty)
 * Drag events on headers are handled by drag.js; everything else about a header lives here.
 */
export function createFolders({ doc, store, t, actions, openMenu, onAddWorkspace, onNewFolder }) {
  const blocks = new Map()

  function makeBlock(folderId) {
    const block = doc.createElement('div')
    block.className = 'dshcl-block'
    block.setAttribute('role', 'none')
    block.dataset.dshclFolder = folderId
    block.innerHTML =
      `<div class="dshcl-folder" role="treeitem" aria-level="1" tabindex="0" draggable="true" aria-labelledby="dshcl-t-${folderId}">` +
      `<span class="dshcl-folder-icon" aria-hidden="true"></span><span class="dshcl-folder-title" id="dshcl-t-${folderId}"></span>` +
      `<span class="dshcl-caret" aria-hidden="true">${SVG.caret}</span><span class="dshcl-spacer"></span><span class="dshcl-count"></span>` +
      `<span class="dshcl-acts"><button type="button" class="dshcl-btn dshcl-add">${SVG.plus}</button>` +
      `<button type="button" class="dshcl-btn dshcl-more" aria-haspopup="menu">${SVG.ellipsis}</button></span></div>` +
      '<div class="dshcl-hint" role="none"></div>'
    const head = block.firstChild
    const onButton = (event) => event.target instanceof Element && event.target.closest('button, input') !== null

    head.addEventListener('click', (event) => {
      if (onButton(event)) return
      if (event.altKey) actions.setAllCollapsed(!(actions.folder(folderId)?.collapsed ?? false))
      else actions.toggleFolder(folderId)
    })
    head.addEventListener('dblclick', (event) => {
      if (!onButton(event)) startRename(folderId)
    })
    head.addEventListener('keydown', (event) => {
      if (event.target !== head) return
      const handled = { Enter: () => actions.toggleFolder(folderId), ' ': () => actions.toggleFolder(folderId), F2: () => startRename(folderId), Delete: () => actions.deleteFolder(folderId), ArrowLeft: () => actions.setFolderCollapsed(folderId, true), ArrowRight: () => actions.setFolderCollapsed(folderId, false) }[event.key]
      if (handled === undefined) return
      event.preventDefault()
      event.stopPropagation()
      handled()
    })
    // Right-click, and the long-press Chromium maps to it on touch screens.
    head.addEventListener('contextmenu', (event) => {
      if (onButton(event)) return
      event.preventDefault()
      event.stopPropagation()
      openMenu(folderId, { x: event.clientX, y: event.clientY })
    })
    block.querySelector('.dshcl-more').addEventListener('click', (event) => {
      event.stopPropagation()
      const rect = event.currentTarget.getBoundingClientRect()
      openMenu(folderId, { x: rect.left, y: rect.bottom })
    })
    block.querySelector('.dshcl-add').addEventListener('click', (event) => {
      event.stopPropagation()
      onAddWorkspace(folderId)
    })
    return block
  }

  function paint(block, folder) {
    const sig = JSON.stringify([folder.title, folder.collapsed, folder.members.length, t('more')])
    if (block.dataset.sig === sig || block.querySelector('.dshcl-rename') !== null) return
    block.dataset.sig = sig
    const { icon, text } = splitIcon(folder.title)
    block.querySelector('.dshcl-folder-icon').textContent = icon
    const title = block.querySelector('.dshcl-folder-title')
    title.textContent = text
    title.title = folder.title
    const count = block.querySelector('.dshcl-count')
    count.textContent = String(folder.members.length)
    count.setAttribute('aria-label', `${folder.members.length} ${t('workspaces')}`)
    block.querySelector('.dshcl-hint').textContent = t('dropIntoFolder')
    const more = block.querySelector('.dshcl-more')
    more.setAttribute('aria-label', t('more'))
    more.title = t('more')
    const add = block.querySelector('.dshcl-add')
    add.setAttribute('aria-label', t('addWorkspaceHere'))
    add.title = t('addWorkspaceHere')
    const head = block.firstChild
    head.setAttribute('aria-expanded', String(!folder.collapsed))
    head.title = t('folderHeaderHint')
    toggleAttr(block, 'data-collapsed', folder.collapsed)
    toggleAttr(block, 'data-empty', folder.members.length === 0)
  }

  /** Swap the title for an input; Enter commits, Escape cancels, focus returns to the header. */
  function startRename(folderId) {
    const block = blocks.get(folderId)
    const folder = actions.folder(folderId)
    const title = block?.querySelector('.dshcl-folder-title') ?? null
    if (block === undefined || folder === undefined || title === null) return
    const input = doc.createElement('input')
    input.className = 'dshcl-rename'
    input.value = folder.title
    input.setAttribute('aria-label', t('rename'))
    let done = false
    const finish = (commit) => {
      if (done) return
      done = true
      input.replaceWith(title)
      block.dataset.sig = ''
      if (commit) actions.renameFolder(folderId, input.value)
      else paint(block, folder)
      if (doc.activeElement === doc.body || doc.activeElement === null) block.firstChild.focus({ preventScroll: true })
    }
    input.addEventListener('keydown', (event) => {
      event.stopPropagation()
      if (event.key === 'Enter') finish(true)
      if (event.key === 'Escape') finish(false)
    })
    input.addEventListener('blur', () => finish(true))
    for (const type of ['click', 'dblclick', 'pointerdown', 'dragstart', 'contextmenu']) input.addEventListener(type, (event) => event.stopPropagation())
    title.replaceWith(input)
    input.focus()
    input.select()
  }

  /**
   * Put every folder's block in place. A header goes before its first member; an empty folder goes before
   * the next folder's header, or before the first loose workspace. Placed last to first so two empty
   * folders never chase each other. Mutation-free when nothing moved. With `place` false (mid-drag)
   * headers are only repainted, never moved.
   */
  function placeAll(list, sections, state, { place = true } = {}) {
    const memberOf = new Map()
    for (const folder of state.folders) for (const id of folder.members) memberOf.set(id, folder)
    for (const [id, block] of blocks) {
      if (!state.folders.some((folder) => folder.id === id)) {
        block.remove()
        blocks.delete(id)
      }
    }
    let nextBlock = null
    for (const folder of [...state.folders].reverse()) {
      let block = blocks.get(folder.id)
      if (block === undefined) blocks.set(folder.id, (block = makeBlock(folder.id)))
      paint(block, folder)
      if (!place) continue
      const anchor =
        sections.find((s) => folder.members.includes(s.id))?.section ?? nextBlock ?? sections.find((s) => !memberOf.has(s.id))?.section ?? null
      if (block.parentElement !== list || nextSiblingSkipping(block, 'dshcl-slot') !== anchor) list.insertBefore(block, anchor)
      nextBlock = block
    }
  }

  /** The folder-plus button in DSH's Workspaces header, beside its action box (which is fixed-width and would clip). */
  function ensureHeaderButton(header) {
    if (header.querySelector('.dshcl-new-folder') !== null) return
    const actionsBox = [...header.children].find((child) => child.querySelector('button') !== null && child.querySelector('input') === null)
    if (actionsBox === undefined) return
    const add = [...actionsBox.children].reverse().find((child) => child.tagName === 'BUTTON') ?? null
    const button = doc.createElement('button')
    button.type = 'button'
    button.className = 'dshcl-new-folder ' + (add?.className ?? 'dshcl-btn')
    button.setAttribute('aria-label', t('newFolder'))
    button.title = t('newFolder')
    button.innerHTML = SVG.folderPlus
    button.addEventListener('click', () => onNewFolder())
    header.insertBefore(button, actionsBox)
  }

  return {
    placeAll,
    startRename,
    ensureHeaderButton,
    blockOf: (folderId) => blocks.get(folderId),
    folderIdOf: (el) => el.closest('.dshcl-block')?.dataset.dshclFolder,
    removeAll: () => {
      for (const block of blocks.values()) block.remove()
    },
    dispose: () => {
      for (const block of blocks.values()) block.remove()
      blocks.clear()
      doc.querySelector('.dshcl-new-folder')?.remove()
    }
  }
}
