import { HINT_KEY, LAYOUT, NS, TIMING } from './constants.js'
import { findParts, sectionsOf } from './dsh-dom.js'
import { createFolders } from './folders.js'
import { CSS } from './styles.js'
import { nestForks } from './tree.js'
import { toggleAttr } from './util.js'

/**
 * The overlay on DSH's list: finds it, keeps it tagged and furnished (member indent, folder headers, fork
 * tree, first-run hint), and re-runs after every DSH re-render. Nothing of DSH's is replaced.
 */
export function createOverlay({ doc, win, storage, workspaces, sessions, store, actions, orderSync, t }) {
  const disposers = []
  let openMenu = () => {}
  let isDragging = () => false
  let pendingAdd = null // { folderId, known: Set<workspaceId>, until }
  let onboard = null
  let parts = { header: null, root: null, list: null }

  const style = doc.createElement('style')
  style.dataset.plugin = NS
  style.dataset.pluginCss = NS
  style.textContent = CSS
  doc.head.appendChild(style)
  disposers.push(() => style.remove())

  const getList = () => (parts.list?.isConnected ? parts.list : (parts = findParts(doc)).list)

  const folders = createFolders({
    doc,
    store,
    t,
    actions,
    openMenu: (folderId, point) => openMenu(folderId, point),
    onAddWorkspace: (folderId) => addWorkspaceTo(folderId),
    onNewFolder: () => newFolder()
  })

  // ---- the main pass; mutation-free when nothing changed
  function sync() {
    parts = findParts(doc)
    const { header, list } = parts
    if (header !== null) folders.ensureHeaderButton(header)
    const state = store.get()
    const sections = list === null ? [] : sectionsOf(list)
    if (list === null || sections.length === 0) {
      folders.removeAll()
      onboard?.remove()
      return
    }
    const memberOf = new Map()
    for (const folder of state.folders) for (const id of folder.members) memberOf.set(id, folder)
    const byId = sessions.list.getSnapshot().byId ?? {}
    for (const { id, section } of sections) {
      const folder = memberOf.get(id)
      toggleAttr(section, 'data-dshcl-member', folder !== undefined)
      toggleAttr(section, 'data-dshcl-hidden', folder?.collapsed === true)
      nestForks(section, { byId, collapsed: state.collapsedSessions ?? {}, isDragging: isDragging(), t, onToggle: actions.toggleSessionCollapsed })
    }
    syncOnboard(list, sections, state)
    folders.placeAll(list, sections, state, { place: !isDragging() })
  }

  /** One dismissible line at the top of the list while there are no folders yet but enough workspaces for them. */
  function syncOnboard(list, sections, state) {
    const wanted = state.folders.length === 0 && sections.length >= LAYOUT.ONBOARD_MIN_WORKSPACES && storage?.getItem(HINT_KEY) === null
    if (!wanted) return onboard?.remove()
    if (onboard === null) {
      onboard = doc.createElement('div')
      onboard.className = 'dshcl-onboard'
      onboard.setAttribute('role', 'note')
      const text = doc.createElement('span')
      const button = doc.createElement('button')
      button.type = 'button'
      button.addEventListener('click', () => {
        try {
          storage?.setItem(HINT_KEY, '1')
        } catch {}
        onboard.remove()
      })
      onboard.append(text, button)
    }
    onboard.firstChild.textContent = t('onboard')
    onboard.lastChild.textContent = t('gotIt')
    if (onboard.parentElement !== list || onboard !== list.firstElementChild) list.prepend(onboard)
  }

  // ---- folder commands that need the DOM
  function newFolder(workspaceId) {
    const id = actions.createFolder(t('newFolder'), workspaceId)
    sync()
    folders.startRename(id)
    return id
  }

  /** '+' on a folder: open DSH's own Add workspace flow and file what it adds into that folder. */
  function addWorkspaceTo(folderId) {
    const header = parts.header ?? findParts(doc).header
    const box = header === null ? undefined : [...header.children].find((child) => child.querySelector('button') !== null && child.querySelector('input') === null)
    const add = box === undefined ? null : ([...box.children].reverse().find((child) => child.tagName === 'BUTTON') ?? null)
    if (add === null) return
    pendingAdd = { folderId, known: new Set(orderSync.liveOrder()), until: Date.now() + TIMING.ADD_TO_FOLDER_WINDOW_MS }
    add.click()
  }
  function settlePendingAdd() {
    if (pendingAdd === null) return
    if (Date.now() > pendingAdd.until) return void (pendingAdd = null)
    const fresh = orderSync.liveOrder().find((id) => !pendingAdd.known.has(id))
    if (fresh === undefined) return
    const { folderId } = pendingAdd
    pendingAdd = null
    actions.moveToFolder(fresh, folderId, { id: fresh, before: null })
  }

  /** The pill's label from the stores, falling back to the row's text. */
  const labelOf = (kind, id) => {
    if (kind === 'workspace') {
      const title = workspaces.list.getSnapshot().items?.find((item) => item.workspaceId === id)?.title
      return title === 'default-workspace' ? undefined : title // DSH shows this one localized; the row text has it
    }
    const session = sessions.list.getSnapshot().byId?.[id]
    return session?.blank ? undefined : (session?.title ?? undefined)
  }

  // ---- re-sync on DSH re-renders, folder edits and list changes
  let syncTimer = 0
  const syncSoon = () => {
    if (syncTimer === 0) syncTimer = setTimeout(() => ((syncTimer = 0), sync()), TIMING.SYNC_MS)
  }
  let observed = null
  const observer = new win.MutationObserver((records) => {
    if (records.some((record) => !(record.target instanceof Element) || record.target.closest('.dshcl-block, .dshcl-slot, .dshcl-onboard') === null)) syncSoon()
  })
  const watch = () => {
    const { root } = findParts(doc)
    if (root === observed) return
    observer.disconnect()
    observed = root
    if (root !== null) observer.observe(root, { childList: true, subtree: true })
    syncSoon()
  }
  // ponytail: a 1 s poll re-finds DSH's list after it remounts; a sidebar-level hook would replace it if DSH adds one.
  const poll = setInterval(watch, TIMING.POLL_MS)
  watch()
  disposers.push(store.subscribe(() => (syncSoon(), orderSync.normalizeSoon())))
  disposers.push(workspaces.list.subscribe(() => (syncSoon(), orderSync.normalizeSoon(), settlePendingAdd())))
  disposers.push(sessions.list.subscribe(syncSoon))
  disposers.push(() => {
    clearInterval(poll)
    observer.disconnect()
    clearTimeout(syncTimer)
    onboard?.remove()
    folders.dispose()
    for (const el of doc.querySelectorAll('[data-dshcl-member], [data-dshcl-hidden], [data-dshcl-depth], [data-dshcl-last]')) {
      for (const name of ['data-dshcl-member', 'data-dshcl-hidden', 'data-dshcl-depth', 'data-dshcl-last']) el.removeAttribute(name)
    }
    for (const el of doc.querySelectorAll('.dshcl-tree-line, .dshcl-tree-toggle')) el.remove()
    doc.body.classList.remove('dshcl-dragging')
  })

  return {
    folders,
    getList,
    sync,
    newFolder,
    renameFolder: (folderId) => folders.startRename(folderId),
    addWorkspaceTo,
    labelOf,
    setMenuOpener: (fn) => {
      openMenu = fn
    },
    setDragging: (fn) => {
      isDragging = fn
    },
    dispose: () => disposers.forEach((dispose) => dispose())
  }
}
