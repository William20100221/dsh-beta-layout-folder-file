// dsh-beta-layout-folder-file, browser half.
// DSH's own Workspace list keeps rendering every row, menu and hover card. On top of it this file adds:
//   - folders: headers inserted into DSH's list; a folder's workspaces stay together through DSH's own
//     saved workspace order and sit indented under the header;
//   - a tree for forked sessions: forks nest under their source with a connector line and a caret;
//   - Claude-style drag effects on DSH's native drag: a pill drag image, a dimmed list, the lifted row
//     collapsing, and a dashed slot that pushes rows apart where the drop will land;
//   - two rows in a session's "..." menu (Export as ZIP, Generate title) and the plugin's settings page.
// Hand-written in dsh's client-bundle format (no build step); `require` reaches only the shell's shared modules.
// Folder-plus icon paths from Lucide (ISC license, https://lucide.dev).
window.__ModuleLoader__.load({
  id: 'dsh-beta-layout-folder-file',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    const React = require('react')
    const { useState, useEffect } = React
    const h = React.createElement
    const P = require('@deepseek-ai/dsh-client-ui-primitives')

    const PKG = 'dsh-beta-layout-folder-file'
    const NS = 'dsh-beta-layout'
    const ROUTE = 'api/dsh-beta-layout'
    const STORAGE_KEY = 'dsh-claude-layout:v2' // kept from 0.2.0 so folders carry over

    const en = {
      newFolder: 'New folder',
      dropIntoFolder: 'Drag workspaces here',
      rename: 'Rename',
      deleteFolder: 'Delete folder',
      more: 'More',
      forks: 'forks',
      export: 'Export as ZIP',
      generateTitle: 'Generate title',
      generating: 'Generating title…',
      titled: 'Title updated',
      titleFailed: 'Could not generate a title',
      autoTitle: 'Generate an AI title after every reply',
      autoTitleHint: 'Off: DSH titles a session once, from its first message. Use "Generate title" in a session’s ⋯ menu to retitle it from the whole conversation.',
      summary: 'Folders, fork tree, drag effects, ZIP export and AI titles for the Workspaces sidebar'
    }
    const zh = {
      newFolder: '新建文件夹',
      dropIntoFolder: '将工作区拖到这里',
      rename: '重命名',
      deleteFolder: '删除文件夹',
      more: '更多',
      forks: '个分支',
      export: '导出为 ZIP',
      generateTitle: '生成标题',
      generating: '正在生成标题…',
      titled: '标题已更新',
      titleFailed: '无法生成标题',
      autoTitle: '每次回复后自动生成 AI 标题',
      autoTitleHint: '关闭时，DSH 只会根据第一条消息为会话命名一次。可在会话的 ⋯ 菜单中选择“生成标题”，根据整段对话重新命名。',
      summary: '为工作区侧栏添加文件夹、分支树、拖拽效果、ZIP 导出和 AI 标题'
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
      // Folder members sit under their header; DSH's own rows keep their full-width hover fill.
      '[data-dshcl-member]{--dsh-workspace-indent:12px!important}',
      '[data-dshcl-hidden]{display:none!important}',
      // Fork tree: children indent with a connector line; a caret on the source row folds them.
      '[data-dshcl-depth]{position:relative;margin-left:calc(var(--dshcl-depth) * 16px)}',
      '.dshcl-tree-line{position:absolute;left:-10px;top:-3px;width:8px;height:calc(100% + 3px);border-left:1px solid var(--dsw-alias-border-l2);pointer-events:none}',
      '.dshcl-tree-line::after{content:"";position:absolute;left:-1px;top:0;width:8px;height:calc(50% + 3px);border-left:1px solid var(--dsw-alias-border-l2);border-bottom:1px solid var(--dsw-alias-border-l2);border-bottom-left-radius:6px}',
      '[data-dshcl-last] .dshcl-tree-line{border-left-color:transparent}',
      '.dshcl-tree-toggle{display:inline-flex;align-items:center;flex:none;width:16px;height:16px;margin-left:2px;border-radius:4px;color:var(--dsw-alias-label-tertiary);cursor:pointer}',
      '.dshcl-tree-toggle:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
      '.dshcl-tree-toggle svg{transform:rotate(90deg);transition:transform .15s}',
      '.dshcl-tree-toggle[data-collapsed] svg{transform:none}',
      // Drag effects over DSH's native drag.
      'body.dshcl-dragging [role="tree"] [data-row-key],body.dshcl-dragging .dshcl-folder{opacity:.45;transition:opacity .15s}',
      'body.dshcl-dragging [data-dshcl-source]{height:0!important;min-height:0!important;padding-top:0!important;padding-bottom:0!important;margin-top:0!important;margin-bottom:0!important;border:0!important;opacity:0;overflow:hidden;transition:height .15s,opacity .15s}',
      'body.dshcl-dragging .dshcl-block[data-over] .dshcl-folder{opacity:1;background:var(--dsw-alias-interactive-bg-hover);box-shadow:inset 0 0 0 1.5px var(--dsw-alias-brand-primary,#4d6bfe)}',
      'body.dshcl-dragging [class*="DropBefore"]::before,body.dshcl-dragging [class*="DropAfter"]::after,body.dshcl-dragging [class*="dropBefore"]::before,body.dshcl-dragging [class*="dropAfter"]::after,body.dshcl-dragging [class*="listTopDropIndicator"]{display:none!important}',
      '.dshcl-slot{box-sizing:border-box;height:0;margin:0 4px;border:1.5px dashed var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));border-radius:10px;pointer-events:none;opacity:0;transition:height .15s,margin .15s,opacity .15s}',
      '.dshcl-slot[data-open]{height:32px;margin:2px 4px;opacity:1}',
      '.dshcl-ghost{position:fixed;left:-1000px;top:-1000px;z-index:-1;display:flex;align-items:center;max-width:240px;height:30px;padding:0 12px;border-radius:10px;background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#0f1115);font:14px var(--dsw-font-family,system-ui);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 6px 20px rgba(0,0,0,.14),0 0 0 1px rgba(0,0,0,.05)}',
      '.dshcl-ghost[data-group]{font-size:13px;font-weight:600}',
      '.dshcl-menu{position:fixed;z-index:2147483000;min-width:160px;padding:4px;border-radius:12px;background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#0f1115);font:13px var(--dsw-font-family,system-ui);box-shadow:0 8px 28px rgba(0,0,0,.16),0 0 0 1px rgba(0,0,0,.06)}',
      '.dshcl-menu button{display:flex;align-items:center;width:100%;height:32px;padding:0 10px;border:none;border-radius:8px;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer}',
      '.dshcl-menu button:hover,.dshcl-menu button:focus-visible{background:var(--dsw-alias-interactive-bg-hover);outline:none}',
      '.dshcl-toast{position:fixed;left:50%;bottom:28px;z-index:2147483000;transform:translateX(-50%);padding:8px 14px;border-radius:10px;background:var(--dsw-alias-toast-bg,#222);color:var(--dsw-alias-toast-label,#fff);font:13px var(--dsw-font-family,system-ui);box-shadow:0 8px 28px rgba(0,0,0,.2)}',
      '.dshcl-settings{font-size:13px;color:var(--dsw-alias-label-primary)}',
      '.dshcl-settings label{display:flex;align-items:center;gap:8px;cursor:pointer}',
      '.dshcl-settings p{margin:6px 0 0 24px;font-size:12px;color:var(--dsw-alias-label-tertiary)}',
      '@media (prefers-reduced-motion:reduce){.dshcl-caret,.dshcl-tree-toggle svg,.dshcl-slot{transition:none}}'
    ].join('')

    const FOLDER_PLUS =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v6"/><path d="M9 13h6"/><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>'
    const CARET = '<svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true"><path d="M2 1l4 3-4 3z" fill="currentColor"/></svg>'
    const ELLIPSIS =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>'

    // ---------------------------------------------------------------- folder model (pure)
    // folders: ordered [{ id, title, collapsed, members: [workspaceId] }]. Member order comes from DSH's
    // saved workspace order, so `members` is a set kept as an array. Folders sit above loose workspaces.
    // collapsedSessions: { [sessionId]: true } for folded fork trees.
    const EMPTY = { folders: [], collapsedSessions: {} }

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

    function toggleSessionCollapsed(state, sessionId) {
      const collapsedSessions = { ...(state.collapsedSessions ?? {}) }
      if (collapsedSessions[sessionId]) delete collapsedSessions[sessionId]
      else collapsedSessions[sessionId] = true
      return { ...state, collapsedSessions }
    }

    /**
     * The workspace order DSH should hold: each folder's members together (in folder order), then loose
     * workspaces. Inside a group the current order is kept, except a just-dropped workspace `pin`
     * ({ id, before }), placed before `before` in its group, or at the group's end when `before` is null
     * or elsewhere. This is what DSH's own drop would do, so the two never disagree.
     */
    function desiredOrder(order, state, pin) {
      const pos = new Map(order.map((id, i) => [id, i]))
      const place = (ids) => {
        const group = ids.filter((id) => pos.has(id)).sort((a, b) => pos.get(a) - pos.get(b))
        if (pin === undefined || pin === null || !group.includes(pin.id)) return group
        const rest = group.filter((id) => id !== pin.id)
        const at = pin.before === null ? -1 : rest.indexOf(pin.before)
        rest.splice(at < 0 ? rest.length : at, 0, pin.id)
        return rest
      }
      const grouped = state.folders.flatMap((folder) => place(folder.members))
      const taken = new Set(grouped)
      return [...grouped, ...place(order.filter((id) => !taken.has(id)))]
    }

    /**
     * Fewest `insertBefore(id, beforeId)` calls turning `order` into `target`: keep a longest run already
     * in order, move the rest. `beforeId` null means the end.
     */
    function planMoves(order, target) {
      const pos = new Map(order.map((id, i) => [id, i]))
      const seq = target.map((id) => pos.get(id))
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

    /**
     * Fork tree order for one workspace's rows: `ids` in DSH's order, `parentOf(id)` the fork source.
     * Returns rows depth-first with depth and whether each is the last child of its parent.
     * A row whose parent is not in `ids` stays a root.
     */
    function treeOrder(ids, parentOf) {
      const present = new Set(ids)
      const children = new Map()
      const roots = []
      for (const id of ids) {
        const parent = parentOf(id)
        if (parent === undefined || parent === id || !present.has(parent)) roots.push(id)
        else children.set(parent, [...(children.get(parent) ?? []), id])
      }
      const out = []
      const visit = (id, depth, last) => {
        const kids = children.get(id) ?? []
        out.push({ id, depth, last, parent: kids.length > 0 })
        kids.forEach((kid, i) => visit(kid, depth + 1, i === kids.length - 1))
      }
      roots.forEach((id) => visit(id, 0, false))
      return out
    }

    // ponytail: folders live in this app's localStorage, like DSH's own session order; move to the Host if they must sync across devices.
    function createStore(storage) {
      const read = () => {
        try {
          const value = JSON.parse(storage?.getItem(STORAGE_KEY) ?? 'null')
          if (value && Array.isArray(value.folders)) return { ...EMPTY, ...value }
          // 0.1.0 kept folders as { entries: ['f:id', ...], folders: { id: { title, children } }, collapsed }.
          const old = JSON.parse(storage?.getItem('dsh-claude-layout:v1') ?? 'null')
          if (old && Array.isArray(old.entries) && old.folders) {
            const folders = old.entries
              .filter((key) => key.startsWith('f:') && old.folders[key.slice(2)])
              .map((key) => ({ id: key.slice(2), title: old.folders[key.slice(2)].title, collapsed: old.collapsed?.[key] === true, members: [...old.folders[key.slice(2)].children] }))
            return { ...EMPTY, folders }
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

    // ---------------------------------------------------------------- host calls, toasts
    /** Call the Host half through its Connection route (same-origin, cookie-authenticated like DSH's export). */
    function rpc(method, payload) {
      return fetch(ROUTE, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ method, payload: payload ?? {} })
      })
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          return response.json()
        })
        .then((result) => {
          if (!result || result.ok !== true) throw new Error(result?.error?.message ?? 'request failed')
          return result.value
        })
    }

    let toastEl = null
    let toastTimer = 0
    function toast(text) {
      if (toastEl === null) {
        toastEl = document.createElement('div')
        toastEl.className = 'dshcl-toast'
        toastEl.setAttribute('role', 'status')
      }
      toastEl.textContent = text
      document.body.appendChild(toastEl)
      clearTimeout(toastTimer)
      toastTimer = setTimeout(() => toastEl?.remove(), 3500)
    }

    /** DSH's own session export route (dsh-session-log-export): the browser downloads the ZIP. */
    function downloadSession(sessionId) {
      const a = document.createElement('a')
      a.href = `api/session.export?sessionId=${encodeURIComponent(sessionId)}&includeDescendants=true`
      a.download = ''
      document.body.appendChild(a)
      a.click()
      a.remove()
    }

    // ---------------------------------------------------------------- the overlay
    const workspaceIdOf = (row) => row.dataset.rowKey.slice('workspace:'.length)
    const textOf = (row) => (row.querySelector('[class*="title"]') ?? row).textContent.trim()
    const toggleAttr = (el, name, on, value = '') => {
      if (on && el.getAttribute(name) !== value) el.setAttribute(name, value)
      else if (!on && el.hasAttribute(name)) el.removeAttribute(name)
    }

    function mount(ctx, workspaces, sessions, store) {
      const t = ctx.locale.bind(NS)
      const blocks = new Map()
      const disposers = []
      let drag = null
      let menu = null
      let pin = null

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
      const nextSibling = (el) => {
        let next = el.nextElementSibling
        while (next && next.classList.contains('dshcl-slot')) next = next.nextElementSibling
        return next
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
          const moves = planMoves(order, desiredOrder(order, pruned, pin))
          pin = null
          for (const [id, before] of moves) await workspaces.insertBefore(id, before ?? undefined)
        } catch (error) {
          console.warn('[dsh-beta-layout] reorder rejected:', error)
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

      const halfOf = (event, el) => {
        const rect = el.getBoundingClientRect()
        return event.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
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
          event.dataTransfer.setData('text/plain', 'dshcl-folder:' + folderId)
          beginDrag(event, { kind: 'folder', id: folderId, el: head }, folder.title, true)
        })
        // A drop is accepted from this plugin's own drags and from DSH's workspace rows (text/plain).
        const accepts = (event) => (drag !== null && drag.kind !== 'session') || (drag === null && event.dataTransfer.types.includes('text/plain'))
        const over = (event) => {
          if (!accepts(event) || (drag?.kind === 'folder' && drag.id === folderId)) return
          event.preventDefault()
          event.stopPropagation()
          event.dataTransfer.dropEffect = 'move'
          if (drag?.kind === 'folder') {
            setOver(null)
            const half = halfOf(event, block)
            drag.over = { folderId, half }
            placeSlot(block.parentElement, half === 'before' ? block : block.nextSibling)
          } else {
            clearSlot()
            setOver(block)
          }
        }
        block.addEventListener('dragenter', over)
        block.addEventListener('dragover', over)
        block.addEventListener('dragleave', (event) => {
          if (!block.contains(event.relatedTarget)) setOver(null)
        })
        block.addEventListener('drop', (event) => {
          if (!accepts(event)) return
          event.preventDefault()
          event.stopPropagation()
          if (drag?.kind === 'folder') {
            dropFolder(folderId, halfOf(event, block))
          } else {
            // DSH writes the dragged workspace's id as text/plain, so a drop files even if dragstart was missed.
            const id = drag?.kind === 'workspace' ? drag.id : event.dataTransfer.getData('text/plain')
            if (id && liveOrder().includes(id)) {
              pin = { id, before: null }
              store.set(updateFolder(assign(store.get(), id, folderId), folderId, { collapsed: false }))
            }
          }
          endDrag()
        })
        return block
      }

      /** Reorder the dragged folder before or after `folderId`. */
      function dropFolder(folderId, half) {
        const others = store.get().folders.filter((folder) => folder.id !== drag.id)
        const at = others.findIndex((folder) => folder.id === folderId)
        const before = half === 'after' ? (others[at + 1]?.id ?? null) : folderId
        store.set(moveFolder(store.get(), drag.id, before))
      }

      let overBlock = null
      function setOver(block) {
        if (overBlock !== null && overBlock !== block) overBlock.removeAttribute('data-over')
        overBlock = block
        if (block !== null) block.setAttribute('data-over', '')
      }

      // ---- the drop slot: a dashed row-sized gap that pushes rows apart where the drop will land
      let slot = null
      function placeSlot(parent, before) {
        if (slot === null) {
          slot = document.createElement('div')
          slot.className = 'dshcl-slot'
        }
        if (before === slot) before = slot.nextSibling
        if (slot.parentElement === parent && slot.nextSibling === before) return
        parent.insertBefore(slot, before)
        slot.removeAttribute('data-open')
        void slot.offsetHeight
        slot.setAttribute('data-open', '')
      }
      function clearSlot() {
        slot?.remove()
      }

      // ---- the main pass: tag DSH's sections, nest forks, place folder headers; mutation-free when nothing changed
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
          nestForks(section, state)
        }
        for (const [id, block] of blocks) {
          if (!state.folders.some((folder) => folder.id === id)) {
            block.remove()
            blocks.delete(id)
          }
        }
        if (drag !== null) return
        // Placed last to first: a header goes before its first member; an empty folder goes before the
        // next folder's header, or before the first loose workspace.
        let nextBlock = null
        for (const folder of [...state.folders].reverse()) {
          let block = blocks.get(folder.id)
          if (block === undefined) blocks.set(folder.id, (block = makeBlock(folder.id)))
          paint(block, folder)
          const anchor =
            sections.find((s) => folder.members.includes(s.id))?.section ?? nextBlock ?? sections.find((s) => !memberOf.has(s.id))?.section ?? null
          if (block.parentElement !== list || nextSibling(block) !== anchor) list.insertBefore(block, anchor)
          nextBlock = block
        }
      }

      /** Session rows of one workspace section: DSH wraps each row for its hover card, so the wrapper moves. */
      const sessionWrappers = (section) =>
        [...section.children]
          .map((el) => ({ el, row: el.matches('[data-row-key^="session:"]') ? el : el.querySelector(':scope > [data-row-key^="session:"]') }))
          .filter((entry) => entry.row !== null)

      function nestForks(section, state) {
        const wrappers = sessionWrappers(section)
        if (wrappers.length === 0) return
        const byId = sessions.list.getSnapshot().byId ?? {}
        const idOf = (row) => row.dataset.rowKey.slice('session:'.length)
        const byRowId = new Map(wrappers.map((entry) => [idOf(entry.row), entry]))
        const order = treeOrder([...byRowId.keys()], (id) => byId[id]?.parentId)
        const collapsed = state.collapsedSessions ?? {}
        const hiddenUnder = new Set()
        let ref = wrappers[0].el.previousSibling
        for (const node of order) {
          const { el, row } = byRowId.get(node.id)
          if (drag === null) {
            const next = ref ? ref.nextSibling : section.firstChild
            if (next !== el) section.insertBefore(el, next)
          }
          ref = el
          const parent = byId[node.id]?.parentId
          const hidden = node.depth > 0 && (collapsed[parent] === true || hiddenUnder.has(parent))
          if (hidden) hiddenUnder.add(node.id)
          toggleAttr(el, 'data-dshcl-hidden', hidden)
          toggleAttr(row, 'data-dshcl-depth', node.depth > 0, String(node.depth))
          row.style.setProperty('--dshcl-depth', String(node.depth))
          toggleAttr(row, 'data-dshcl-last', node.last)
          let line = row.querySelector(':scope > .dshcl-tree-line')
          if (node.depth > 0 && line === null) {
            line = document.createElement('span')
            line.className = 'dshcl-tree-line'
            row.prepend(line)
          } else if (node.depth === 0 && line !== null) line.remove()
          let toggle = row.querySelector('.dshcl-tree-toggle')
          if (node.parent && toggle === null) {
            toggle = document.createElement('span')
            toggle.className = 'dshcl-tree-toggle'
            toggle.setAttribute('role', 'button')
            toggle.innerHTML = CARET
            for (const type of ['pointerdown', 'mousedown', 'dblclick']) toggle.addEventListener(type, (event) => event.stopPropagation())
            toggle.addEventListener('click', (event) => {
              event.stopPropagation()
              event.preventDefault()
              store.set(toggleSessionCollapsed(store.get(), node.id))
            })
            const title = row.querySelector('[class*="title"]')
            if (title) title.after(toggle)
            else row.appendChild(toggle)
          } else if (!node.parent && toggle !== null) toggle.remove()
          if (toggle) {
            toggleAttr(toggle, 'data-collapsed', collapsed[node.id] === true)
            toggle.title = t('forks')
          }
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
        block.firstChild.setAttribute('aria-expanded', String(!folder.collapsed))
        toggleAttr(block, 'data-collapsed', folder.collapsed)
        toggleAttr(block, 'data-empty', folder.members.length === 0)
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
        stopMarquee()
        drag = info
        ghost.textContent = label
        toggleAttr(ghost, 'data-group', group)
        try {
          event.dataTransfer.setDragImage(ghost, 24, 15)
        } catch {}
        document.body.classList.add('dshcl-dragging')
        // Collapsing the lifted row inside dragstart would cancel the drag, so it waits a tick.
        setTimeout(() => {
          if (drag === info) info.el.setAttribute('data-dshcl-source', '')
        }, 0)
        closeMenu()
      }

      function endDrag() {
        drag = null
        setOver(null)
        clearSlot()
        document.body.classList.remove('dshcl-dragging')
        for (const el of document.querySelectorAll('[data-dshcl-source]')) el.removeAttribute('data-dshcl-source')
        normalizeSoon()
        syncSoon()
      }

      const onDragStart = (event) => {
        const { list } = findParts()
        const row = event.target instanceof Element ? event.target.closest('[data-row-key]') : null
        if (!list || !row || !list.contains(row)) return
        const key = row.dataset.rowKey
        const kind = key.startsWith('workspace:') ? 'workspace' : key.startsWith('session:') ? 'session' : null
        if (kind === null) return
        beginDrag(event, { kind, id: kind === 'workspace' ? workspaceIdOf(row) : key, el: row }, textOf(row), kind === 'workspace')
      }
      // Mirror DSH's drop position (top or bottom half of the target) with the slot.
      const onDragOver = (event) => {
        if (drag === null || !(event.target instanceof Element)) return
        const { list } = findParts()
        if (!list || event.target.closest('.dshcl-block')) return
        if (drag.kind === 'session') {
          const row = event.target.closest('[data-row-key^="session:"]')
          if (!row || row === drag.el) return
          const wrapper = row.parentElement.matches('[role="tree"] > div') ? row : row.parentElement
          const section = wrapper.parentElement
          if (!section.contains(drag.el)) return
          placeSlot(section, halfOf(event, row) === 'before' ? wrapper : wrapper.nextSibling)
          return
        }
        const section = event.target.closest('[role="tree"] > div')
        if (!section || section === slot || section.contains(drag.el)) return
        const half = halfOf(event, section)
        drag.over = { section, half }
        placeSlot(list, half === 'before' ? section : section.nextSibling)
      }
      // A workspace dropped among a folder's workspaces joins that folder; among loose ones, it leaves.
      // The slot takes no pointer events, so a drop on it lands on the list: use what was hovered last.
      const onDrop = (event) => {
        if (drag === null || !(event.target instanceof Element) || event.target.closest('.dshcl-block')) return
        if (!event.target.closest('[data-row-key]')) event.preventDefault()
        if (drag.kind === 'folder') {
          if (drag.over) dropFolder(drag.over.folderId, drag.over.half)
          return
        }
        if (drag.kind !== 'workspace') return
        const section = event.target.closest('[role="tree"] > div') ?? drag.over?.section
        const row = section?.querySelector('[data-row-key^="workspace:"]')
        if (!row) return
        const target = workspaceIdOf(row)
        if (target === drag.id) return
        // Same rule as DSH's drop: before the target, or before whatever follows it.
        const half = drag.over?.section === section ? drag.over.half : halfOf(event, section)
        const nextRow = half === 'before' ? row : nextSibling(section)?.querySelector('[data-row-key^="workspace:"]')
        pin = { id: drag.id, before: nextRow ? workspaceIdOf(nextRow) : null }
        store.set(assign(store.get(), drag.id, folderOf(store.get(), target)?.id ?? null))
      }
      const onDragEnd = () => {
        if (drag !== null) endDrag()
      }
      // ---- title marquee: DSH scrolls a clipped title to its end and stops; from there, bounce it back and forth.
      const PX_PER_MS = 0.03
      const HOLD_MS = 700
      let marquee = null
      const placeTitle = (title, left, range) => {
        title.scrollLeft = left
        toggleAttr(title, 'data-scrolled', left > 0)
        toggleAttr(title, 'data-clipped', left < range)
      }
      const stopMarquee = () => {
        if (marquee === null) return
        cancelAnimationFrame(marquee.frame)
        marquee = null
      }
      const onPointerOver = (event) => {
        const row = event.target instanceof Element ? event.target.closest('[data-row-key]') : null
        if (!row || marquee?.row === row) return
        stopMarquee()
        const title = row.querySelector('[class*="title"]')
        if (!title || matchMedia('(prefers-reduced-motion: reduce)').matches) return
        const range = title.scrollWidth - title.clientWidth
        if (range <= 8) return
        let phase = 'wait'
        let pos = range
        let dir = -1
        let prev = 0
        let holdUntil = 0
        const step = (now) => {
          if (marquee?.row !== row) return
          if (phase === 'wait') {
            if (title.scrollLeft >= range - 1) {
              phase = 'hold'
              holdUntil = now + HOLD_MS
            }
          } else if (phase === 'hold') {
            if (now >= holdUntil) {
              phase = 'move'
              prev = now
            }
          } else {
            pos = Math.max(0, Math.min(range, pos + (now - prev) * PX_PER_MS * dir))
            prev = now
            placeTitle(title, pos, range)
            if (pos === 0 || pos === range) {
              dir = -dir
              phase = 'hold'
              holdUntil = now + HOLD_MS
            }
          }
          marquee.frame = requestAnimationFrame(step)
        }
        marquee = { row, frame: requestAnimationFrame(step) }
      }
      const onPointerOut = (event) => {
        if (marquee !== null && !(event.relatedTarget instanceof Element && marquee.row.contains(event.relatedTarget))) stopMarquee()
      }
      document.addEventListener('pointerover', onPointerOver, true)
      document.addEventListener('pointerout', onPointerOut, true)
      disposers.push(() => {
        stopMarquee()
        document.removeEventListener('pointerover', onPointerOver, true)
        document.removeEventListener('pointerout', onPointerOut, true)
      })

      document.addEventListener('dragstart', onDragStart, true)
      document.addEventListener('dragover', onDragOver, true)
      document.addEventListener('drop', onDrop, true)
      document.addEventListener('dragend', onDragEnd, true)
      disposers.push(() => {
        document.removeEventListener('dragstart', onDragStart, true)
        document.removeEventListener('dragover', onDragOver, true)
        document.removeEventListener('drop', onDrop, true)
        document.removeEventListener('dragend', onDragEnd, true)
      })

      // ---- wiring: re-sync on DSH re-renders, folder edits and list changes
      // A timer, not requestAnimationFrame: frames pause while the window is hidden.
      let frame = 0
      const syncSoon = () => {
        if (frame === 0) frame = setTimeout(() => ((frame = 0), sync()), 16)
      }
      let observed = null
      const observer = new MutationObserver((records) => {
        if (records.some((record) => !(record.target instanceof Element) || record.target.closest('.dshcl-block,.dshcl-slot') === null)) syncSoon()
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
        clearSlot()
        for (const block of blocks.values()) block.remove()
        for (const el of document.querySelectorAll('[data-dshcl-member],[data-dshcl-hidden],[data-dshcl-depth],[data-dshcl-last]')) {
          for (const name of ['data-dshcl-member', 'data-dshcl-hidden', 'data-dshcl-depth', 'data-dshcl-last']) el.removeAttribute(name)
        }
        for (const el of document.querySelectorAll('.dshcl-tree-line,.dshcl-tree-toggle,.dshcl-new-folder')) el.remove()
        document.body.classList.remove('dshcl-dragging')
      })
      disposers.push(store.subscribe(() => (syncSoon(), normalizeSoon())))
      disposers.push(workspaces.list.subscribe(() => (syncSoon(), normalizeSoon())))
      disposers.push(sessions.list.subscribe(syncSoon))
      return () => disposers.forEach((dispose) => dispose())
    }

    // ---------------------------------------------------------------- session menu rows and the settings page
    function ExportMenuItem({ sessionId, useMenuOpenState, t }) {
      const [, setMenuOpen] = useMenuOpenState()
      return h(P.MenuItemButton, {
        icon: h(P.IconDownloadOutlineRegular, {}),
        onSelect: () => {
          setMenuOpen(false)
          downloadSession(sessionId)
        },
        children: t('export')
      })
    }

    const generateTitle = (ctx, sessions, sessionId, t) => {
      toast(t('generating'))
      // `using` keeps the session loaded on the Host while the title is generated.
      return sessions
        .using(sessionId, { source: 'workspaceOperation' }, () => rpc('title.generate', { sessionId }))
        .then((result) => {
          if (!result.ok) throw new Error(result.error.message)
          toast(`${t('titled')}: ${result.value.title}`)
        })
        .catch((error) => {
          console.warn('[dsh-beta-layout] title generation failed:', error)
          toast(`${t('titleFailed')}: ${error instanceof Error ? error.message : String(error)}`)
        })
    }

    function makeGenerateTitleMenuItem(ctx, sessions) {
      return function GenerateTitleMenuItem({ sessionId, useMenuOpenState, t }) {
        const [, setMenuOpen] = useMenuOpenState()
        return h(P.MenuItemButton, {
          icon: h(P.IconSparkleRegular, {}),
          onSelect: () => {
            setMenuOpen(false)
            generateTitle(ctx, sessions, sessionId, t)
          },
          children: t('generateTitle')
        })
      }
    }

    function makeSettingsForm(ctx) {
      return function SettingsForm({ t, view }) {
        const [auto, setAuto] = useState(null)
        useEffect(() => {
          rpc('settings.get').then((value) => setAuto(value.autoTitle === true), () => setAuto(false))
        }, [])
        if (view === 'summary') return t('summary')
        return h(
          'div',
          { className: 'dshcl-settings' },
          h(
            'label',
            null,
            h('input', {
              type: 'checkbox',
              checked: auto === true,
              disabled: auto === null,
              onChange: (event) => {
                const next = event.target.checked
                setAuto(next)
                rpc('settings.set', { autoTitle: next }).catch(() => setAuto(!next))
              }
            }),
            t('autoTitle')
          ),
          h('p', null, t('autoTitleHint'))
        )
      }
    }

    // ---------------------------------------------------------------- plugin body
    const inject = ['locale', 'workspaces', 'sessions', 'slots']
    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'dsh-beta-layout: dictionaries')
      if (typeof document === 'undefined') return
      const sessions = ctx.get('sessions')
      const store = createStore(typeof localStorage === 'undefined' ? undefined : localStorage)
      ctx.effect(() => mount(ctx, ctx.get('workspaces'), sessions, store), 'dsh-beta-layout: sidebar')
      ctx.slots.inject('sidebar.workspaces.session.menu.item', function* () {
        yield ctx.slots.register({ name: 'sidebar.workspaces.session.menu.item', id: 'beta-layout-title', order: 250, locale: NS }, makeGenerateTitleMenuItem(ctx, sessions))
        yield ctx.slots.register({ name: 'sidebar.workspaces.session.menu.item', id: 'beta-layout-export', order: 460, locale: NS }, ExportMenuItem)
      })
      ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({ name: 'plugins.bundle.config', key: PKG, locale: NS }, makeSettingsForm(ctx)))
    }

    exports.inject = inject
    exports.apply = apply
    exports.assign = assign
    exports.addFolder = addFolder
    exports.updateFolder = updateFolder
    exports.deleteFolder = deleteFolder
    exports.moveFolder = moveFolder
    exports.prune = prune
    exports.toggleSessionCollapsed = toggleSessionCollapsed
    exports.desiredOrder = desiredOrder
    exports.planMoves = planMoves
    exports.treeOrder = treeOrder
    exports.createStore = createStore
    return module.exports
  }
})
