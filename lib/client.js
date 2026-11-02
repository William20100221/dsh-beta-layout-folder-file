// Folders for DSH's own Workspace list, plus Claude-style drag effects.
// This does not replace any DSH UI: the built-in list keeps rendering every row, menu and hover card.
// The plugin inserts folder headers into that list, keeps each folder's workspaces next to each other
// through DSH's own saved workspace order, and restyles DSH's native drag (pill image, dimmed list).
// Hand-written in dsh's client-bundle format (no build step); `require` reaches only the shell's shared modules.
// Folder-plus icon paths from Lucide (ISC license, https://lucide.dev).
window.__ModuleLoader__.load({
  id: 'dsh-claude-layout',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports

    const NS = 'dsh-claude-layout'
    const STORAGE_KEY = 'dsh-claude-layout:v2'

    const en = {
      newFolder: 'New folder',
      dropIntoFolder: 'Drag workspaces here',
      rename: 'Rename',
      deleteFolder: 'Delete folder',
      more: 'More'
    }
    const zh = {
      newFolder: '新建文件夹',
      dropIntoFolder: '将工作区拖到这里',
      rename: '重命名',
      deleteFolder: '删除文件夹',
      more: '更多'
    }

    const CSS = [
      '.dshcl-block{margin-top:4px}',
      '.dshcl-folder{position:relative;display:flex;align-items:center;gap:6px;height:32px;padding:0 6px 0 12px;border-radius:var(--dsw-radius-md,10px);font-size:13px;font-weight:600;color:var(--dsw-alias-label-secondary);cursor:pointer;user-select:none;-webkit-user-select:none}',
      '.dshcl-folder:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.dshcl-folder-title{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.dshcl-caret{display:inline-flex;flex:none;transform:rotate(90deg);transition:transform .15s}',
      '.dshcl-block[data-collapsed] .dshcl-caret{transform:none}',
      '.dshcl-spacer{flex:1}',
      '.dshcl-count{font-size:12px;font-weight:400;color:var(--dsw-alias-label-tertiary)}',
      '.dshcl-block:not([data-collapsed]) .dshcl-count{display:none}',
      '.dshcl-acts{display:none}',
      '.dshcl-folder:hover .dshcl-acts,.dshcl-block[data-menu] .dshcl-acts{display:inline-flex}',
      '.dshcl-folder:hover .dshcl-count{display:none}',
      '.dshcl-btn{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:none;border-radius:var(--dsw-radius-sm,8px);background:none;color:var(--dsw-alias-label-secondary);cursor:pointer}',
      '.dshcl-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.dshcl-hint{height:28px;display:flex;align-items:center;padding-left:24px;font-size:12px;color:var(--dsw-alias-label-tertiary)}',
      '.dshcl-block[data-collapsed] .dshcl-hint,.dshcl-block:not([data-empty]) .dshcl-hint{display:none}',
      '.dshcl-rename{flex:1;min-width:0;height:24px;padding:0 6px;border:1px solid var(--dsw-alias-brand-primary);border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;outline:none}',
      // Members sit under their folder; DSH's own rows keep their full-width hover fill.
      '[data-dshcl-member]{--dsh-workspace-indent:12px!important}',
      '[data-dshcl-hidden]{display:none!important}',
      // Drag effects: the list dims, the lifted row fades, the target folder lights up.
      'body.dshcl-dragging [role="tree"] [data-row-key],body.dshcl-dragging .dshcl-folder{opacity:.45;transition:opacity .15s}',
      'body.dshcl-dragging [data-dshcl-source]{opacity:.2}',
      'body.dshcl-dragging .dshcl-block[data-over] .dshcl-folder{opacity:1;background:var(--dsw-alias-interactive-bg-hover);box-shadow:inset 0 0 0 1.5px var(--dsw-alias-brand-primary,#4d6bfe)}',
      '.dshcl-block[data-over-before]{box-shadow:0 -2px 0 var(--dsw-alias-brand-primary,#4d6bfe)}',
      '.dshcl-block[data-over-after]{box-shadow:0 2px 0 var(--dsw-alias-brand-primary,#4d6bfe)}',
      '.dshcl-ghost{position:fixed;left:-1000px;top:-1000px;z-index:-1;display:flex;align-items:center;max-width:240px;height:30px;padding:0 12px;border-radius:10px;background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#0f1115);font:14px var(--dsw-font-family,system-ui);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 6px 20px rgba(0,0,0,.14),0 0 0 1px rgba(0,0,0,.05)}',
      '.dshcl-ghost[data-group]{font-size:13px;font-weight:600}',
      '.dshcl-menu{position:fixed;z-index:2147483000;min-width:160px;padding:4px;border-radius:12px;background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#0f1115);font:13px var(--dsw-font-family,system-ui);box-shadow:0 8px 28px rgba(0,0,0,.16),0 0 0 1px rgba(0,0,0,.06)}',
      '.dshcl-menu button{display:flex;align-items:center;width:100%;height:32px;padding:0 10px;border:none;border-radius:8px;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer}',
      '.dshcl-menu button:hover,.dshcl-menu button:focus-visible{background:var(--dsw-alias-interactive-bg-hover);outline:none}',
      '@media (prefers-reduced-motion:reduce){.dshcl-caret{transition:none}}'
    ].join('')

    const FOLDER_PLUS =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v6"/><path d="M9 13h6"/><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>'
    const CARET = '<svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true"><path d="M2 1l4 3-4 3z" fill="currentColor"/></svg>'
    const ELLIPSIS =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>'

    // ---------------------------------------------------------------- folder model (pure)
    // folders: ordered [{ id, title, collapsed, members: [workspaceId] }]. Member order comes from DSH's
    // saved workspace order, so `members` is a set kept as an array. Folders sit above loose workspaces.
    const EMPTY = { folders: [] }

    const folderOf = (state, workspaceId) => state.folders.find((folder) => folder.members.includes(workspaceId))

    /** Put a workspace in a folder (or take it out with `folderId` null). */
    function assign(state, workspaceId, folderId) {
      return {
        ...state,
        folders: state.folders.map((folder) => {
          const members = folder.members.filter((id) => id !== workspaceId)
          if (folder.id === folderId) members.push(workspaceId)
          return { ...folder, members }
        })
      }
    }

    function addFolder(state, id, title) {
      return { ...state, folders: [{ id, title, collapsed: false, members: [] }, ...state.folders] }
    }

    function updateFolder(state, id, patch) {
      return { ...state, folders: state.folders.map((folder) => (folder.id === id ? { ...folder, ...patch } : folder)) }
    }

    /** Deleting a folder only ungroups its workspaces. */
    function deleteFolder(state, id) {
      return { ...state, folders: state.folders.filter((folder) => folder.id !== id) }
    }

    /** Move folder `id` before folder `beforeId` (null: to the end). */
    function moveFolder(state, id, beforeId) {
      const moving = state.folders.find((folder) => folder.id === id)
      if (moving === undefined || id === beforeId) return state
      const rest = state.folders.filter((folder) => folder.id !== id)
      const at = beforeId === null ? rest.length : rest.findIndex((folder) => folder.id === beforeId)
      rest.splice(at < 0 ? rest.length : at, 0, moving)
      return { ...state, folders: rest }
    }

    /** Drop members whose workspace no longer exists. */
    function prune(state, liveIds) {
      const live = new Set(liveIds)
      return { ...state, folders: state.folders.map((folder) => ({ ...folder, members: folder.members.filter((id) => live.has(id)) })) }
    }

    /**
     * The workspace order DSH should hold: each folder's members together (in folder order), then loose
     * workspaces. Inside a group the current order is kept, except `last` (a workspace just dropped on a
     * folder header), which goes to the end of its folder.
     */
    function desiredOrder(order, state, last) {
      const pos = new Map(order.map((id, i) => [id, i]))
      const live = (id) => pos.has(id)
      const byPos = (a, b) => (a === last) - (b === last) || pos.get(a) - pos.get(b)
      const grouped = state.folders.flatMap((folder) => folder.members.filter(live).sort(byPos))
      const taken = new Set(grouped)
      return [...grouped, ...order.filter((id) => !taken.has(id))]
    }

    /**
     * Fewest `insertBefore(id, beforeId)` calls turning `order` into `target`: keep a longest run already
     * in order, move the rest. `beforeId` null means the end.
     */
    function planMoves(order, target) {
      const pos = new Map(order.map((id, i) => [id, i]))
      const seq = target.map((id) => pos.get(id))
      // Longest increasing subsequence of current positions, as indices into `target`.
      const tails = []
      const prev = new Array(seq.length).fill(-1)
      for (let i = 0; i < seq.length; i++) {
        let lo = 0
        let hi = tails.length
        while (lo < hi) {
          const mid = (lo + hi) >> 1
          if (seq[tails[mid]] < seq[i]) lo = mid + 1
          else hi = mid
        }
        if (lo > 0) prev[i] = tails[lo - 1]
        tails[lo] = i
      }
      const keep = new Set()
      for (let i = tails[tails.length - 1] ?? -1; i >= 0; i = prev[i]) keep.add(i)
      const moves = []
      for (let i = target.length - 1; i >= 0; i--) if (!keep.has(i)) moves.push([target[i], target[i + 1] ?? null])
      return moves
    }

    // ponytail: folders live in this app's localStorage, like DSH's own session order; move to the Host if they must sync across devices.
    function createStore(storage) {
      const read = () => {
        try {
          const value = JSON.parse(storage?.getItem(STORAGE_KEY) ?? 'null')
          if (value && Array.isArray(value.folders)) return value
          // 0.1.0 kept folders as { entries: ['f:id', ...], folders: { id: { title, children } }, collapsed }.
          const old = JSON.parse(storage?.getItem('dsh-claude-layout:v1') ?? 'null')
          if (old && Array.isArray(old.entries) && old.folders) {
            const folders = old.entries
              .filter((key) => key.startsWith('f:') && old.folders[key.slice(2)])
              .map((key) => ({ id: key.slice(2), title: old.folders[key.slice(2)].title, collapsed: old.collapsed?.[key] === true, members: [...old.folders[key.slice(2)].children] }))
            return { folders }
          }
        } catch {}
        return EMPTY
      }
      let state = read()
      const listeners = new Set()
      return {
        get: () => state,
        subscribe: (listener) => (listeners.add(listener), () => listeners.delete(listener)),
        set: (next) => {
          state = next
          try {
            storage?.setItem(STORAGE_KEY, JSON.stringify(next))
          } catch {}
          listeners.forEach((listener) => listener())
        }
      }
    }

    // ---------------------------------------------------------------- the overlay
    const workspaceIdOf = (row) => row.dataset.rowKey.slice('workspace:'.length)
    const textOf = (row) => (row.querySelector('[class*="title"]') ?? row).textContent.trim()

    function mount(ctx, workspaces) {
      const t = ctx.locale.bind(NS)
      const store = createStore(typeof localStorage === 'undefined' ? undefined : localStorage)
      const blocks = new Map()
      const disposers = []
      let drag = null
      let menu = null
      let placeLast = null

      const style = document.createElement('style')
      style.dataset.plugin = NS
      style.dataset.pluginCss = NS
      style.textContent = CSS
      document.head.appendChild(style)
      disposers.push(() => style.remove())

      const ghost = document.createElement('div')
      ghost.className = 'dshcl-ghost'
      document.body.appendChild(ghost)
      disposers.push(() => ghost.remove())

      // DSH's browser root: the parent of its directory-flow seat is the Workspaces header.
      const findParts = () => {
        const header = document.querySelector('[data-slot="sidebar.workspaces.directoryFlow"]')?.parentElement
        const root = header?.parentElement
        const list = root?.querySelector('[role="tree"]') ?? null
        return { header, root, list }
      }

      /** Root-level workspace sections in DOM order, keyed by workspace id. */
      const sectionsOf = (list) => {
        const out = []
        for (const row of list.querySelectorAll('[data-row-key^="workspace:"]')) {
          const section = row.closest('[role="tree"] > div')
          if (section === null || section.parentElement !== list || row.closest('[role="group"]') !== null) continue
          out.push({ id: workspaceIdOf(row), section, row })
        }
        return out
      }

      const liveOrder = () => (workspaces.list.getSnapshot().items ?? []).map((item) => item.workspaceId)

      // ---- keep DSH's saved order matching the folders
      let normalizing = false
      let normalizeTimer = 0
      const normalizeSoon = () => {
        clearTimeout(normalizeTimer)
        normalizeTimer = setTimeout(normalize, 350)
      }
      async function normalize() {
        const snap = workspaces.list.getSnapshot()
        if (normalizing || snap.phase !== 'ready' || drag !== null) return
        normalizing = true
        try {
          const order = liveOrder()
          const pruned = prune(store.get(), order)
          if (JSON.stringify(pruned) !== JSON.stringify(store.get())) store.set(pruned)
          const moves = planMoves(order, desiredOrder(order, pruned, placeLast))
          placeLast = null
          for (const [id, before] of moves) await workspaces.insertBefore(id, before ?? undefined)
        } catch (error) {
          console.warn('[dsh-claude-layout] reorder rejected:', error)
        } finally {
          normalizing = false
        }
      }

      // ---- folder headers
      function closeMenu() {
        if (menu === null) return
        menu.el.remove()
        menu.block.removeAttribute('data-menu')
        document.removeEventListener('pointerdown', menu.outside, true)
        document.removeEventListener('keydown', menu.key, true)
        menu = null
      }

      function openMenu(block, folder, anchor) {
        closeMenu()
        const el = document.createElement('div')
        el.className = 'dshcl-menu'
        el.setAttribute('role', 'menu')
        const item = (label, run) => {
          const button = document.createElement('button')
          button.type = 'button'
          button.setAttribute('role', 'menuitem')
          button.textContent = label
          button.addEventListener('click', () => {
            closeMenu()
            run()
          })
          el.appendChild(button)
        }
        item(t('rename'), () => startRename(block, folder.id))
        item(t('deleteFolder'), () => store.set(deleteFolder(store.get(), folder.id)))
        document.body.appendChild(el)
        const rect = anchor.getBoundingClientRect()
        const box = el.getBoundingClientRect()
        el.style.left = `${Math.max(8, Math.min(rect.left, innerWidth - box.width - 8))}px`
        el.style.top = `${rect.bottom + 4 + box.height > innerHeight - 8 ? rect.top - box.height - 4 : rect.bottom + 4}px`
        el.querySelector('button').focus()
        const outside = (event) => {
          if (!el.contains(event.target) && !anchor.contains(event.target)) closeMenu()
        }
        const key = (event) => {
          if (event.key === 'Escape') closeMenu()
        }
        document.addEventListener('pointerdown', outside, true)
        document.addEventListener('keydown', key, true)
        block.setAttribute('data-menu', '')
        menu = { el, block, outside, key }
      }

      function startRename(block, folderId) {
        const folder = store.get().folders.find((entry) => entry.id === folderId)
        const title = block.querySelector('.dshcl-folder-title')
        if (folder === undefined || title === null) return
        const input = document.createElement('input')
        input.className = 'dshcl-rename'
        input.value = folder.title
        let done = false
        const finish = (commit) => {
          if (done) return
          done = true
          const next = input.value.trim()
          input.replaceWith(title)
          block.dataset.sig = ''
          if (commit && next !== '' && next !== folder.title) store.set(updateFolder(store.get(), folderId, { title: next }))
          else sync()
        }
        input.addEventListener('keydown', (event) => {
          event.stopPropagation()
          if (event.key === 'Enter') finish(true)
          if (event.key === 'Escape') finish(false)
        })
        input.addEventListener('blur', () => finish(true))
        for (const type of ['click', 'pointerdown', 'dragstart']) input.addEventListener(type, (event) => event.stopPropagation())
        title.replaceWith(input)
        input.focus()
        input.select()
      }

      function makeBlock(folderId) {
        const block = document.createElement('div')
        block.className = 'dshcl-block'
        block.dataset.dshclFolder = folderId
        block.innerHTML =
          '<div class="dshcl-folder" role="button" draggable="true">' +
          '<span class="dshcl-folder-title"></span><span class="dshcl-caret">' + CARET + '</span>' +
          '<span class="dshcl-spacer"></span><span class="dshcl-count"></span>' +
          '<span class="dshcl-acts"><button type="button" class="dshcl-btn">' + ELLIPSIS + '</button></span></div>' +
          '<div class="dshcl-hint"></div>'
        const head = block.firstChild
        const current = () => store.get().folders.find((folder) => folder.id === folderId)
        head.addEventListener('click', (event) => {
          if (event.target.closest('button,input')) return
          const folder = current()
          if (folder) store.set(updateFolder(store.get(), folderId, { collapsed: !folder.collapsed }))
        })
        head.addEventListener('dblclick', (event) => {
          if (!event.target.closest('button,input')) startRename(block, folderId)
        })
        block.querySelector('.dshcl-btn').addEventListener('click', (event) => {
          event.stopPropagation()
          const folder = current()
          if (menu?.block === block) closeMenu()
          else if (folder) openMenu(block, folder, event.currentTarget)
        })
        head.addEventListener('dragstart', (event) => {
          const folder = current()
          if (!folder) return
          beginDrag(event, { kind: 'folder', id: folderId }, folder.title, true)
          event.dataTransfer.setData('text/plain', 'dshcl-folder')
        })
        block.addEventListener('dragover', (event) => {
          if (drag === null || drag.kind === 'session' || (drag.kind === 'folder' && drag.id === folderId)) return
          event.preventDefault()
          event.stopPropagation()
          event.dataTransfer.dropEffect = 'move'
          setOver(block, drag.kind === 'folder' ? halfOf(event, block) : 'into')
        })
        block.addEventListener('dragleave', (event) => {
          if (!block.contains(event.relatedTarget)) setOver(null)
        })
        block.addEventListener('drop', (event) => {
          if (drag === null || drag.kind === 'session') return
          event.preventDefault()
          event.stopPropagation()
          if (drag.kind === 'folder') {
            const others = store.get().folders.filter((folder) => folder.id !== drag.id)
            const at = others.findIndex((folder) => folder.id === folderId)
            const before = halfOf(event, block) === 'after' ? (others[at + 1]?.id ?? null) : folderId
            store.set(moveFolder(store.get(), drag.id, before))
          } else {
            placeLast = drag.id
            store.set(updateFolder(assign(store.get(), drag.id, folderId), folderId, { collapsed: false }))
          }
          endDrag()
        })
        return block
      }

      const halfOf = (event, el) => {
        const rect = el.getBoundingClientRect()
        return event.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
      }

      let overBlock = null
      function setOver(block, mode) {
        if (overBlock !== null && (overBlock !== block || overBlock.dataset.overMode !== mode)) {
          overBlock.removeAttribute('data-over')
          overBlock.removeAttribute('data-over-before')
          overBlock.removeAttribute('data-over-after')
          delete overBlock.dataset.overMode
        }
        overBlock = block
        if (block === null) return
        block.dataset.overMode = mode
        block.setAttribute(mode === 'into' ? 'data-over' : `data-over-${mode}`, '')
      }

      // ---- the main pass: tag DSH's sections and place folder headers; mutation-free when nothing changed
      function sync() {
        const { header, list } = findParts()
        if (header) ensureNewFolderButton(header)
        const state = store.get()
        const sections = list ? sectionsOf(list) : []
        if (!list || sections.length === 0) {
          for (const block of blocks.values()) if (block.isConnected) block.remove()
          return
        }
        const memberOf = new Map()
        for (const folder of state.folders) for (const id of folder.members) memberOf.set(id, folder)
        for (const { id, section } of sections) {
          const folder = memberOf.get(id)
          toggleAttr(section, 'data-dshcl-member', folder !== undefined)
          toggleAttr(section, 'data-dshcl-hidden', folder?.collapsed === true)
        }
        for (const [id, block] of blocks) {
          if (!state.folders.some((folder) => folder.id === id)) {
            block.remove()
            blocks.delete(id)
          }
        }
        // Placed last to first: a header goes before its first member; an empty folder goes before the
        // next folder's header, or before the first loose workspace.
        let nextBlock = null
        for (const folder of [...state.folders].reverse()) {
          let block = blocks.get(folder.id)
          if (block === undefined) blocks.set(folder.id, (block = makeBlock(folder.id)))
          paint(block, folder)
          const anchor =
            sections.find((s) => folder.members.includes(s.id))?.section ?? nextBlock ?? sections.find((s) => !memberOf.has(s.id))?.section ?? null
          if (block.parentElement !== list || block.nextElementSibling !== anchor) list.insertBefore(block, anchor)
          nextBlock = block
        }
      }

      function paint(block, folder) {
        const sig = JSON.stringify([folder.title, folder.collapsed, folder.members.length, t('more'), t('dropIntoFolder')])
        if (block.dataset.sig === sig || block.querySelector('.dshcl-rename')) return
        block.dataset.sig = sig
        block.querySelector('.dshcl-folder-title').textContent = folder.title
        block.querySelector('.dshcl-count').textContent = String(folder.members.length)
        block.querySelector('.dshcl-hint').textContent = t('dropIntoFolder')
        const more = block.querySelector('.dshcl-btn')
        more.setAttribute('aria-label', t('more'))
        more.title = t('more')
        const head = block.firstChild
        head.setAttribute('aria-expanded', String(!folder.collapsed))
        toggleAttr(block, 'data-collapsed', folder.collapsed)
        toggleAttr(block, 'data-empty', folder.members.length === 0)
      }

      function toggleAttr(el, name, on, value = '') {
        if (on && el.getAttribute(name) !== value) el.setAttribute(name, value)
        else if (!on && el.hasAttribute(name)) el.removeAttribute(name)
      }

      function ensureNewFolderButton(header) {
        if (header.querySelector('.dshcl-new-folder')) return
        const actions = [...header.children].find((child) => child.querySelector('button') && !child.querySelector('input'))
        if (!actions) return
        const add = [...actions.children].reverse().find((child) => child.tagName === 'BUTTON') ?? null
        const button = document.createElement('button')
        button.type = 'button'
        button.className = 'dshcl-new-folder ' + (add?.className ?? 'dshcl-btn')
        button.setAttribute('aria-label', t('newFolder'))
        button.title = t('newFolder')
        button.innerHTML = FOLDER_PLUS
        button.addEventListener('click', () => {
          const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
          store.set(addFolder(store.get(), id, t('newFolder')))
          sync()
          const block = blocks.get(id)
          if (block) startRename(block, id)
        })
        // Beside DSH's action box, not inside it: that box has a fixed width and would clip Add workspace.
        header.insertBefore(button, actions)
      }

      // ---- drag: restyle DSH's native drag and learn where workspaces land
      function beginDrag(event, info, label, group) {
        drag = info
        ghost.textContent = label
        toggleAttr(ghost, 'data-group', group)
        event.dataTransfer.setDragImage(ghost, 24, 15)
        document.body.classList.add('dshcl-dragging')
        closeMenu()
      }

      function endDrag() {
        drag = null
        setOver(null)
        document.body.classList.remove('dshcl-dragging')
        for (const el of document.querySelectorAll('[data-dshcl-source]')) el.removeAttribute('data-dshcl-source')
        normalizeSoon()
      }

      const onDragStart = (event) => {
        const { list } = findParts()
        const row = event.target instanceof Element ? event.target.closest('[data-row-key]') : null
        if (!list || !row || !list.contains(row)) return
        const key = row.dataset.rowKey
        const kind = key.startsWith('workspace:') ? 'workspace' : key.startsWith('session:') ? 'session' : null
        if (kind === null) return
        beginDrag(event, { kind, id: kind === 'workspace' ? workspaceIdOf(row) : key }, textOf(row), kind === 'workspace')
        row.setAttribute('data-dshcl-source', '')
      }
      // A workspace dropped among a folder's workspaces joins that folder; among loose ones, it leaves.
      const onDrop = (event) => {
        if (drag?.kind !== 'workspace' || !(event.target instanceof Element) || event.target.closest('.dshcl-block')) return
        const section = event.target.closest('[role="tree"] > div')
        const row = section?.querySelector('[data-row-key^="workspace:"]')
        if (!row) return
        const target = workspaceIdOf(row)
        if (target !== drag.id) store.set(assign(store.get(), drag.id, folderOf(store.get(), target)?.id ?? null))
      }
      const onDragEnd = () => {
        if (drag !== null) endDrag()
      }
      document.addEventListener('dragstart', onDragStart, true)
      document.addEventListener('drop', onDrop, true)
      document.addEventListener('dragend', onDragEnd, true)
      disposers.push(() => {
        document.removeEventListener('dragstart', onDragStart, true)
        document.removeEventListener('drop', onDrop, true)
        document.removeEventListener('dragend', onDragEnd, true)
      })

      // ---- wiring: re-sync on DSH re-renders, folder edits and workspace list changes
      // A timer, not requestAnimationFrame: frames pause while the window is hidden.
      let frame = 0
      const syncSoon = () => {
        if (frame === 0) frame = setTimeout(() => ((frame = 0), sync()), 16)
      }
      let observed = null
      const observer = new MutationObserver((records) => {
        if (records.some((record) => !(record.target instanceof Element) || record.target.closest('.dshcl-block') === null)) syncSoon()
      })
      const watch = () => {
        const { root } = findParts()
        if (root === observed) return
        observer.disconnect()
        observed = root ?? null
        if (root) observer.observe(root, { childList: true, subtree: true })
        syncSoon()
      }
      // ponytail: 1s poll to re-find DSH's list after it remounts; a sidebar-level hook would replace it if DSH adds one.
      const poll = setInterval(watch, 1000)
      watch()
      disposers.push(() => {
        clearInterval(poll)
        observer.disconnect()
        clearTimeout(frame)
        clearTimeout(normalizeTimer)
        closeMenu()
        for (const block of blocks.values()) block.remove()
        for (const el of document.querySelectorAll('[data-dshcl-member],[data-dshcl-hidden]')) {
          el.removeAttribute('data-dshcl-member')
          el.removeAttribute('data-dshcl-hidden')
        }
        document.querySelector('.dshcl-new-folder')?.remove()
        document.body.classList.remove('dshcl-dragging')
      })
      disposers.push(store.subscribe(() => (syncSoon(), normalizeSoon())))
      disposers.push(workspaces.list.subscribe(() => (syncSoon(), normalizeSoon())))
      return () => disposers.forEach((dispose) => dispose())
    }

    // ---------------------------------------------------------------- plugin body
    const inject = ['locale', 'workspaces']
    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'dsh-claude-layout: dictionaries')
      if (typeof document === 'undefined') return
      ctx.effect(() => mount(ctx, ctx.get('workspaces')), 'dsh-claude-layout: folders')
    }

    exports.inject = inject
    exports.apply = apply
    exports.assign = assign
    exports.addFolder = addFolder
    exports.updateFolder = updateFolder
    exports.deleteFolder = deleteFolder
    exports.moveFolder = moveFolder
    exports.prune = prune
    exports.desiredOrder = desiredOrder
    exports.planMoves = planMoves
    exports.createStore = createStore
    return module.exports
  }
})
