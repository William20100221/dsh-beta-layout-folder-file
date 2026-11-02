// Claude-style Workspaces list for DSH: user-named folders that hold Workspaces, a Pinned section,
// and drag-and-drop with a lifted pill, dimmed list and sliding rows.
// Hand-written in dsh's client-bundle format (no build step): the shell loads this file as a plain
// script, and `require` reaches only the shell's shared modules.
// Folder-plus icon paths from Lucide (ISC license, https://lucide.dev).
window.__ModuleLoader__.load({
  id: 'dsh-claude-layout',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    const React = require('react')
    const { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback, useSyncExternalStore } = React
    const h = React.createElement
    const P = require('@deepseek-ai/dsh-client-ui-primitives')
    const ReactDOM = require('react-dom')

    const NS = 'dsh-claude-layout'
    const STORAGE_KEY = 'dsh-claude-layout:v1'
    const SESSION_LIMIT = 5

    const en = {
      workspaces: 'Workspaces',
      defaultWorkspace: 'Default workspace',
      search: 'Search sessions',
      newFolder: 'New folder',
      addWorkspace: 'Add workspace',
      newSession: 'New session',
      untitled: 'Untitled',
      pinned: 'Pinned',
      dropHere: 'Drop here',
      dropIntoFolder: 'Drag workspaces here',
      rename: 'Rename',
      deleteFolder: 'Delete folder',
      moveTo: 'Move to folder',
      removeFromFolder: 'Remove from folder',
      pin: 'Pin',
      unpin: 'Unpin',
      archive: 'Archive',
      more: 'More',
      showMore: 'Show more',
      showLess: 'Show less',
      ungrouped: 'Ungrouped',
      noMatches: 'No matches',
      empty: 'No workspaces yet',
      archiveFailed: 'Stop the running work before archiving this session',
      actionFailed: 'That didn’t work'
    }
    const zh = {
      workspaces: '工作区',
      defaultWorkspace: '默认工作区',
      search: '搜索会话',
      newFolder: '新建文件夹',
      addWorkspace: '添加工作区',
      newSession: '新会话',
      untitled: '未命名',
      pinned: '已置顶',
      dropHere: '拖到这里',
      dropIntoFolder: '将工作区拖到这里',
      rename: '重命名',
      deleteFolder: '删除文件夹',
      moveTo: '移动到文件夹',
      removeFromFolder: '移出文件夹',
      pin: '置顶',
      unpin: '取消置顶',
      archive: '归档',
      more: '更多',
      showMore: '显示更多',
      showLess: '收起',
      ungrouped: '未分组',
      noMatches: '无匹配结果',
      empty: '还没有工作区',
      archiveFailed: '请先停止正在运行的任务，再归档此会话',
      actionFailed: '操作未成功'
    }

    const CSS = [
      '.dshcl-root{display:flex;flex-direction:column;height:100%;min-height:0;font-family:var(--dsw-font-family);color:var(--dsw-alias-label-primary)}',
      '.dshcl-head{display:flex;align-items:center;gap:2px;height:36px;padding:0 6px 0 16px;flex:none;font-size:14px;color:var(--dsw-alias-label-secondary)}',
      '.dshcl-head-label{flex:1;min-width:0}',
      '.dshcl-notice{margin:0 12px 6px;padding:6px 10px;border-radius:8px;font-size:12px;background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}',
      '.dshcl-btn{display:inline-flex;align-items:center;justify-content:center;flex:none;width:28px;height:28px;padding:0;border:none;border-radius:var(--dsw-radius-sm,8px);background:none;color:var(--dsw-alias-label-secondary);cursor:pointer}',
      '.dshcl-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.dshcl-search{flex:1;min-width:0;height:28px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm,8px);background:transparent;color:inherit;font:inherit;font-size:13px;outline:none}',
      '.dshcl-scroll{position:relative;flex:1;min-height:0;overflow-y:auto;scrollbar-gutter:stable;padding:0 2px 12px 8px}',
      '.dshcl-row{position:relative;display:flex;align-items:center;gap:8px;height:32px;padding:0 4px 0 8px;border-radius:var(--dsw-radius-md,10px);font-size:14px;cursor:pointer;user-select:none;-webkit-user-select:none}',
      '.dshcl-row:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.dshcl-row[data-current]{background:var(--dsw-alias-interactive-bg-active,var(--dsw-alias-interactive-bg-hover))}',
      '.dshcl-title{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.dshcl-meta{flex:none;padding-right:4px;font-size:12px;color:var(--dsw-alias-label-tertiary)}',
      '.dshcl-acts{display:none;align-items:center;flex:none}',
      '.dshcl-acts .dshcl-btn{width:24px;height:24px}',
      '.dshcl-row:hover .dshcl-acts,.dshcl-row[data-menu] .dshcl-acts{display:flex}',
      '.dshcl-row:hover .dshcl-meta,.dshcl-row[data-menu] .dshcl-meta{display:none}',
      '.dshcl-section{height:30px;margin-top:6px;font-size:13px;font-weight:600;color:var(--dsw-alias-label-secondary)}',
      '.dshcl-section.dshcl-static{cursor:default}',
      '.dshcl-section.dshcl-static:hover{background:none}',
      '.dshcl-caret{display:inline-flex;flex:none;transform:rotate(90deg);transition:transform .15s}',
      '.dshcl-row[data-collapsed] .dshcl-caret{transform:none}',
      '.dshcl-icon{display:inline-flex;flex:none;color:var(--dsw-alias-label-secondary)}',
      '.dshcl-row[data-active] .dshcl-icon{color:var(--dsw-alias-brand-primary)}',
      '.dshcl-children{padding-left:12px}',
      '.dshcl-session{padding-left:32px}',
      '.dshcl-dot{position:absolute;left:14px;display:inline-flex}',
      '.dshcl-hint,.dshcl-more{height:28px;font-size:12px;color:var(--dsw-alias-label-tertiary)}',
      '.dshcl-hint{padding-left:20px;cursor:default}',
      '.dshcl-hint:hover{background:none}',
      '.dshcl-more{padding-left:32px}',
      '.dshcl-empty{padding:16px 12px;font-size:13px;color:var(--dsw-alias-label-tertiary)}',
      '.dshcl-slot{height:32px;border-radius:var(--dsw-radius-md,10px);background:var(--dsw-alias-interactive-bg-hover);box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l2)}',
      '.dshcl-pin-drop{margin:2px 0;border:1px dashed var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary);cursor:default}',
      '.dshcl-pin-drop[data-over]{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
      '.dshcl-dragging,.dshcl-dragging .dshcl-row{cursor:grabbing}',
      '.dshcl-dragging .dshcl-row:hover{background:none}',
      '.dshcl-dragging .dshcl-acts{display:none!important}',
      '.dshcl-dragging .dshcl-meta{display:inline!important}',
      '.dshcl-dragging-group .dshcl-list .dshcl-row{opacity:.45;transition:opacity .15s}',
      '.dshcl-row[data-drop-into]{opacity:1!important;background:var(--dsw-alias-interactive-bg-hover)!important;box-shadow:inset 0 0 0 1.5px var(--dsw-alias-brand-primary)}',
      '.dshcl-row[data-lifted]{visibility:hidden}',
      '.dshcl-ghost{position:fixed;left:0;top:0;z-index:2147483000;pointer-events:none;display:flex;align-items:center;max-width:260px;height:30px;padding:0 12px;border-radius:10px;background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#0f1115);font:14px var(--dsw-font-family,system-ui);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 6px 20px rgba(0,0,0,.14),0 0 0 1px rgba(0,0,0,.05);animation:dshcl-lift .14s ease-out}',
      '.dshcl-ghost[data-group]{font-size:13px;font-weight:600}',
      '@keyframes dshcl-lift{from{opacity:.5;scale:.94}to{opacity:1;scale:1}}',
      '.dshcl-menu{position:fixed;z-index:2147483000;min-width:180px;max-width:280px;padding:4px;border-radius:12px;background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#0f1115);font:13px var(--dsw-font-family,system-ui);box-shadow:0 8px 28px rgba(0,0,0,.16),0 0 0 1px rgba(0,0,0,.06)}',
      '.dshcl-menu-item{display:flex;align-items:center;gap:8px;width:100%;height:32px;padding:0 10px;border:none;border-radius:8px;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.dshcl-menu-item:hover,.dshcl-menu-item:focus-visible{background:var(--dsw-alias-interactive-bg-hover);outline:none}',
      '.dshcl-menu-label{padding:6px 10px 2px;font-size:12px;color:var(--dsw-alias-label-tertiary)}',
      '.dshcl-menu-sep{height:1px;margin:4px 6px;background:var(--dsw-alias-border-l2)}',
      '.dshcl-rename{flex:1;min-width:0;height:24px;padding:0 6px;border:1px solid var(--dsw-alias-brand-primary);border-radius:6px;background:transparent;color:inherit;font:inherit;outline:none}',
      '@media (prefers-reduced-motion:reduce){.dshcl-ghost{animation:none}.dshcl-caret{transition:none}}'
    ].join('')
    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css="dsh-claude-layout"]') === null) {
      const tag = document.createElement('style')
      tag.dataset.plugin = NS
      tag.dataset.pluginCss = NS
      tag.textContent = CSS
      document.head.appendChild(tag)
    }

    const svg = (size, children) =>
      h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }, ...children)
    const FolderPlusIcon = () =>
      svg(16, [
        h('path', { key: 1, d: 'M12 10v6' }),
        h('path', { key: 2, d: 'M9 13h6' }),
        h('path', { key: 3, d: 'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z' })
      ])
    const icon = (name, size = 16) => (P[name] ? h(P[name], { size }) : null)

    // ---------------------------------------------------------------- layout model (pure)
    // entries: top-level order, each 'f:<folderId>' or 'w:<workspaceId>'.
    // folders[id] = { title, children: [workspaceId] }. collapsed['f:id' | 'w:id'] = true.
    const EMPTY = { entries: [], folders: {}, collapsed: {} }

    /** Fit a stored layout to the live Workspace ids: drop gone ones, prepend new ones. */
    function reconcile(layout, workspaceIds) {
      const live = new Set(workspaceIds)
      const seen = new Set()
      const take = (id) => live.has(id) && !seen.has(id) && (seen.add(id), true)
      const folders = {}
      const entries = []
      for (const key of layout.entries) {
        const id = key.slice(2)
        if (key.startsWith('f:')) {
          const folder = layout.folders[id]
          if (folder === undefined || folders[id] !== undefined) continue
          folders[id] = { ...folder, children: folder.children.filter(take) }
          entries.push(key)
        } else if (take(id)) entries.push(key)
      }
      const fresh = workspaceIds.filter((id) => !seen.has(id)).map((id) => 'w:' + id)
      return { collapsed: layout.collapsed ?? {}, entries: [...fresh, ...entries], folders }
    }

    /** Where `key` sits now, as a drop target. */
    function positionOf(layout, key) {
      const index = layout.entries.indexOf(key)
      if (index >= 0) return { parent: 'root', index }
      for (const [folderId, folder] of Object.entries(layout.folders)) {
        const at = folder.children.indexOf(key.slice(2))
        if (at >= 0) return { parent: folderId, index: at }
      }
      return null
    }

    /** Move a folder ('f:') or workspace ('w:') to `target`; `target.index` counts siblings without the moved item. */
    function moveItem(layout, key, target) {
      const isWorkspace = key.startsWith('w:')
      const id = key.slice(2)
      if (target.parent !== 'root' && (!isWorkspace || layout.folders[target.parent] === undefined)) return layout
      const entries = layout.entries.filter((entry) => entry !== key)
      const folders = {}
      for (const [folderId, folder] of Object.entries(layout.folders)) {
        folders[folderId] = isWorkspace ? { ...folder, children: folder.children.filter((child) => child !== id) } : folder
      }
      const into = target.parent === 'root' ? entries : [...folders[target.parent].children]
      into.splice(Math.max(0, Math.min(target.index, into.length)), 0, target.parent === 'root' ? key : id)
      if (target.parent !== 'root') folders[target.parent] = { ...folders[target.parent], children: into }
      return { ...layout, entries, folders }
    }

    function addFolder(layout, id, title) {
      return { ...layout, entries: ['f:' + id, ...layout.entries], folders: { ...layout.folders, [id]: { title, children: [] } } }
    }

    function renameFolder(layout, id, title) {
      const folder = layout.folders[id]
      return folder === undefined ? layout : { ...layout, folders: { ...layout.folders, [id]: { ...folder, title } } }
    }

    /** Delete a folder; its workspaces take its place at the top level. Nothing else is removed. */
    function deleteFolder(layout, id) {
      const folder = layout.folders[id]
      if (folder === undefined) return layout
      const entries = layout.entries.flatMap((entry) => (entry === 'f:' + id ? folder.children.map((child) => 'w:' + child) : [entry]))
      const folders = { ...layout.folders }
      delete folders[id]
      const collapsed = { ...layout.collapsed }
      delete collapsed['f:' + id]
      return { ...layout, entries, folders, collapsed }
    }

    function toggleCollapsed(layout, key, value) {
      const collapsed = { ...layout.collapsed }
      if (value ?? !collapsed[key]) collapsed[key] = true
      else delete collapsed[key]
      return { ...layout, collapsed }
    }

    /** Compact relative time like the sidebar's: now, 5m, 3h, 2d, 1w, 4mo, 1y. */
    function ago(timestamp, now) {
      if (!timestamp) return ''
      const minutes = Math.max(0, now - timestamp) / 60000
      if (minutes < 1) return 'now'
      if (minutes < 60) return Math.floor(minutes) + 'm'
      const hours = minutes / 60
      if (hours < 24) return Math.floor(hours) + 'h'
      const days = hours / 24
      if (days < 7) return Math.floor(days) + 'd'
      if (days < 30) return Math.floor(days / 7) + 'w'
      if (days < 365) return Math.floor(days / 30) + 'mo'
      return Math.floor(days / 365) + 'y'
    }

    // ponytail: layout lives in this browser's localStorage (like DSH's own Session order); move it to the Host if it must sync across devices.
    function createLayoutStore(storage) {
      const read = () => {
        try {
          const value = JSON.parse(storage?.getItem(STORAGE_KEY) ?? 'null')
          if (value && Array.isArray(value.entries) && value.folders && typeof value.folders === 'object') return { ...EMPTY, ...value }
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
    const layoutStore = createLayoutStore(typeof localStorage === 'undefined' ? undefined : localStorage)

    // ---------------------------------------------------------------- drag hit-testing (DOM)
    /**
     * Resolve the drop target under the pointer.
     * Folders and workspaces: `{ parent, index }` or `{ parent, index, into: true }` over a folder header.
     * Sessions: `{ pin: boolean }`. Returns 'keep' to hold the current target, null when outside the list.
     */
    function hitTest(root, key, x, y) {
      const el = typeof document === 'undefined' ? null : document.elementFromPoint(x, y)
      if (!el || !root || !root.contains(el)) return null
      if (key.startsWith('s:')) return { pin: el.closest('[data-pin-zone]') !== null }
      if (el.closest('[data-placeholder]')) return 'keep'
      const head = key.startsWith('w:') ? el.closest('[data-folder-head]') : null
      if (head) return { parent: head.dataset.folderHead, index: Infinity, into: true }
      const block = key.startsWith('f:') ? el.closest('[data-block][data-parent="root"]') : el.closest('[data-block]')
      if (!block) return el.closest('[data-list]') || el.closest('.dshcl-scroll') ? { parent: 'root', index: Infinity } : null
      const siblings = [...block.parentElement.children].filter((child) => child.dataset.block !== undefined)
      const rect = block.getBoundingClientRect()
      const after = y > rect.top + Math.min(rect.height / 2, 16)
      const parent = block.dataset.parent === 'root' ? 'root' : block.dataset.parent.slice(2)
      return { parent, index: siblings.indexOf(block) + (after ? 1 : 0) }
    }

    const sameTarget = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

    function offsetIn(el, root) {
      let y = 0
      for (let node = el; node && node !== root; node = node.offsetParent) y += node.offsetTop
      return y
    }

    // ---------------------------------------------------------------- small components
    function PopMenu({ anchor, items, onClose }) {
      const ref = useRef(null)
      const rect = anchor.getBoundingClientRect()
      const [pos, setPos] = useState({ left: rect.left, top: rect.bottom + 4 })
      useLayoutEffect(() => {
        const box = ref.current?.getBoundingClientRect()
        if (!box) return
        const top = rect.bottom + 4 + box.height > innerHeight - 8 ? Math.max(8, rect.top - box.height - 4) : rect.bottom + 4
        setPos({ left: Math.max(8, Math.min(rect.left, innerWidth - box.width - 8)), top })
        ref.current.querySelector('button')?.focus()
      }, [])
      useEffect(() => {
        const down = (event) => {
          if (!ref.current?.contains(event.target) && !anchor.contains(event.target)) onClose()
        }
        const key = (event) => {
          if (event.key === 'Escape') onClose()
        }
        document.addEventListener('pointerdown', down, true)
        document.addEventListener('keydown', key)
        return () => {
          document.removeEventListener('pointerdown', down, true)
          document.removeEventListener('keydown', key)
        }
      }, [anchor, onClose])
      const menu = h(
        'div',
        { ref, className: 'dshcl-menu', role: 'menu', style: pos },
        items.map((item, i) =>
          item.sep
            ? h('div', { key: i, className: 'dshcl-menu-sep', role: 'separator' })
            : item.onSelect === undefined
              ? h('div', { key: i, className: 'dshcl-menu-label' }, item.label)
              : h(
                  'button',
                  {
                    key: i,
                    type: 'button',
                    role: 'menuitem',
                    className: 'dshcl-menu-item',
                    onClick: () => {
                      onClose()
                      item.onSelect()
                    }
                  },
                  item.icon ?? null,
                  item.label
                )
        )
      )
      return ReactDOM?.createPortal ? ReactDOM.createPortal(menu, document.body) : menu
    }

    function RenameInput({ initial, onDone }) {
      const [value, setValue] = useState(initial)
      const done = useRef(false)
      const finish = (commit) => {
        if (done.current) return
        done.current = true
        const title = value.trim()
        onDone(commit && title !== '' && title !== initial ? title : null)
      }
      return h('input', {
        className: 'dshcl-rename',
        autoFocus: true,
        value,
        onChange: (event) => setValue(event.target.value),
        onFocus: (event) => event.target.select(),
        onKeyDown: (event) => {
          event.stopPropagation()
          if (event.key === 'Enter') finish(true)
          if (event.key === 'Escape') finish(false)
        },
        onBlur: () => finish(true),
        onClick: (event) => event.stopPropagation(),
        onPointerDown: (event) => event.stopPropagation()
      })
    }

    function sessionState(session, statuses) {
      const status = statuses?.get?.(session.id)
      if (status?.pendingInteraction) return 'warning'
      if (status?.running ?? session.running) return 'ongoing'
      if (status?.completionUnread) return 'done'
      return null
    }

    // ---------------------------------------------------------------- the browser
    function Browser(props) {
      const { wide, t, useSessions, useWorkspaces, useSessionStatus, usePanelInfo, useDirectoryFlow, renderSlot, api } = props
      const list = useSessions((state) => state)
      const ws = useWorkspaces((state) => state)
      const statuses = useSessionStatus ? useSessionStatus((state) => state) : undefined
      const panelActive = usePanelInfo ? usePanelInfo((info) => info.activePanelId !== null) : false
      const flowAvailable = useDirectoryFlow ? useDirectoryFlow((occupied) => occupied) : false
      const stored = useSyncExternalStore(layoutStore.subscribe, layoutStore.get)

      const [now, setNow] = useState(() => Date.now())
      const [query, setQuery] = useState(null)
      const [menu, setMenu] = useState(null)
      const [renaming, setRenaming] = useState(null)
      const [expanded, setExpanded] = useState({})
      const [drag, setDrag] = useState(null)
      const [notice, setNotice] = useState(null)
      const [flowOpen, setFlowOpen] = useState(false)
      const [flowBusy, setFlowBusy] = useState(false)
      const scrollRef = useRef(null)
      const dragRef = useRef(null)
      const suppressClick = useRef(false)

      useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 60000)
        return () => clearInterval(timer)
      }, [])
      useEffect(() => {
        if (notice === null) return
        const timer = setTimeout(() => setNotice(null), 4000)
        return () => clearTimeout(timer)
      }, [notice])

      const items = ws.items ?? []
      const ready = ws.phase === 'ready'
      const idsKey = items.map((item) => item.workspaceId).join('\n')
      const layout = useMemo(() => (ready ? reconcile(stored, idsKey === '' ? [] : idsKey.split('\n')) : stored), [stored, idsKey, ready])
      const layoutRef = useRef(layout)
      layoutRef.current = layout
      const commit = (next) => layoutStore.set(next)

      const byWorkspace = useMemo(() => new Map(items.map((item) => [item.workspaceId, item])), [items])
      const archived = useMemo(() => new Set(ws.archivedSessionIds ?? []), [ws.archivedSessionIds])
      const pinned = useMemo(() => new Set(ws.pinnedSessionIds ?? []), [ws.pinnedSessionIds])
      const pinnedRef = useRef(pinned)
      pinnedRef.current = pinned
      const current = panelActive ? undefined : Object.values(list.byId ?? {}).find((s) => (s.retainedBy?.mainView ?? 0) > 0)?.id
      const visible = (s) => s !== undefined && s.origin !== 'subagent' && !archived.has(s.id) && (!s.blank || s.id === current)
      const sessionsOf = (ids) =>
        ids
          .map((id) => list.byId?.[id])
          .filter((s) => visible(s) && !pinned.has(s.id))
          .sort((a, b) => (b.id === current && b.blank) - (a.id === current && a.blank) || (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      const titleOf = (s) => (s.blank ? t('newSession') : (s.title ?? '').trim() || t('untitled'))
      // DSH stores its first-use Workspace as 'default-workspace' and shows it in the reader's language.
      const workspaceTitle = (w) =>
        w.title === 'default-workspace' ? t('defaultWorkspace') : w.title || (w.path ?? '').split(/[\\/]/).filter(Boolean).pop() || t('untitled')
      const fail = (message) => (error) => {
        console.warn('[dsh-claude-layout]', error)
        setNotice(message)
      }

      // ---- FLIP: rows that moved since the last render slide from where they were.
      const tops = useRef(new Map())
      useLayoutEffect(() => {
        const root = scrollRef.current
        if (!root) return
        const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
        const next = new Map()
        for (const el of root.querySelectorAll('[data-flip]')) {
          if (el.offsetParent === null) continue
          const top = offsetIn(el, root)
          const before = tops.current.get(el.dataset.flip)
          next.set(el.dataset.flip, top)
          if (still || before === undefined || Math.abs(before - top) < 1 || !el.animate) continue
          el.getAnimations?.().forEach((animation) => animation.cancel())
          el.animate([{ transform: `translateY(${before - top}px)` }, { transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' })
        }
        tops.current = next
      })

      // ---- drag: press, pass a 5px threshold, then a pill follows the pointer.
      const beginPress = (event, key, label, origin) => {
        if (event.button !== 0 || renaming !== null || query !== null || event.target.closest('button,input')) return
        const startX = event.clientX
        const startY = event.clientY
        let ghost = null
        const move = (ev) => {
          if (ghost === null) {
            if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 5) return
            setMenu(null)
            ghost = document.createElement('div')
            ghost.className = 'dshcl-ghost'
            if (!key.startsWith('s:')) ghost.dataset.group = ''
            ghost.textContent = label
            ;(scrollRef.current?.closest('.dshcl-root') ?? document.body).appendChild(ghost)
            dragRef.current = { key, target: origin }
            setDrag({ key, target: origin })
          }
          ghost.style.transform = `translate(${ev.clientX - 24}px, ${ev.clientY - 15}px)`
          const target = hitTest(scrollRef.current, key, ev.clientX, ev.clientY)
          if (target === 'keep' || sameTarget(target, dragRef.current.target)) return
          dragRef.current.target = target
          setDrag({ key, target })
        }
        const finish = (cancelled) => {
          window.removeEventListener('pointermove', move)
          window.removeEventListener('pointerup', up)
          window.removeEventListener('pointercancel', cancel)
          window.removeEventListener('keydown', escape, true)
          if (ghost === null) return
          ghost.remove()
          suppressClick.current = true
          setTimeout(() => (suppressClick.current = false), 0)
          const target = dragRef.current?.target
          dragRef.current = null
          setDrag(null)
          if (!cancelled && target) drop(key, target)
        }
        const up = () => finish(false)
        const cancel = () => finish(true)
        const escape = (ev) => {
          if (ev.key !== 'Escape' || ghost === null) return
          ev.stopPropagation()
          finish(true)
        }
        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', up)
        window.addEventListener('pointercancel', cancel)
        window.addEventListener('keydown', escape, true)
      }

      const drop = (key, target) => {
        if (key.startsWith('s:')) {
          const id = key.slice(2)
          const isPinned = pinnedRef.current.has(id)
          if (target.pin && !isPinned) api.pin(id).catch(fail(t('actionFailed')))
          if (!target.pin && isPinned) api.unpin(id).catch(fail(t('actionFailed')))
          return
        }
        let next = moveItem(layoutRef.current, key, target)
        if (target.into) next = toggleCollapsed(next, 'f:' + target.parent, false)
        commit(next)
      }

      // ---- actions
      const createFolder = (workspaceId) => {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
        let next = addFolder(layoutRef.current, id, t('newFolder'))
        if (workspaceId !== undefined) next = moveItem(next, 'w:' + workspaceId, { parent: id, index: 0 })
        commit(next)
        setQuery(null)
        setRenaming('f:' + id)
      }
      const openMenu = (key, items) => (event) => {
        event.stopPropagation()
        const anchor = event.currentTarget
        setMenu((open) => (open?.key === key ? null : { key, anchor, items }))
      }
      const closeMenu = useCallback(() => setMenu(null), [])
      const onRowClick = (fn) => (event) => {
        if (suppressClick.current) return
        event.stopPropagation()
        fn()
      }
      const flipKeyOf = (key) => (drag && drag.key === key ? null : key)

      // ---- rows
      const sessionRow = (s, extra = {}) => {
        const key = 's:' + s.id
        const isPinned = pinned.has(s.id)
        const state = sessionState(s, statuses)
        const menuItems = [
          isPinned
            ? { label: t('unpin'), icon: icon('IconPinOutlineRegular'), onSelect: () => api.unpin(s.id).catch(fail(t('actionFailed'))) }
            : { label: t('pin'), icon: icon('IconPinOutlineRegular'), onSelect: () => api.pin(s.id).catch(fail(t('actionFailed'))) },
          { label: t('rename'), icon: icon('IconEditOutlineRegular'), onSelect: () => setRenaming(key) },
          { sep: true },
          { label: t('archive'), icon: icon('IconArchiveOutlineRegular'), onSelect: () => api.archive(s.id).catch(fail(t('archiveFailed'))) }
        ]
        return h(
          'div',
          {
            key,
            className: 'dshcl-row dshcl-session',
            'data-flip': flipKeyOf(key) ?? undefined,
            'data-current': s.id === current ? '' : undefined,
            'data-lifted': drag?.key === key ? '' : undefined,
            'data-menu': menu?.key === key ? '' : undefined,
            title: titleOf(s),
            onPointerDown: s.blank || extra.static ? undefined : (event) => beginPress(event, key, titleOf(s), null),
            onClick: onRowClick(() => api.open(s.id))
          },
          state ? h('span', { className: 'dshcl-dot' }, P.StateDot ? h(P.StateDot, { state }) : null) : null,
          renaming === key
            ? h(RenameInput, {
                initial: titleOf(s),
                onDone: (title) => {
                  setRenaming(null)
                  if (title) api.renameSession(s.id, title).catch(fail(t('actionFailed')))
                }
              })
            : h('span', { className: 'dshcl-title' }, titleOf(s)),
          h('span', { className: 'dshcl-meta' }, extra.meta ?? ago(s.updatedAt, now)),
          s.blank
            ? null
            : h(
                'span',
                { className: 'dshcl-acts' },
                h('button', { type: 'button', className: 'dshcl-btn', 'aria-label': t('more'), title: t('more'), onClick: openMenu(key, menuItems) }, icon('IconEllipsisOutlineRegular'))
              )
        )
      }

      const workspaceBlock = (w, parent) => {
        const key = 'w:' + w.workspaceId
        const collapsed = layout.collapsed[key] === true
        const title = workspaceTitle(w)
        const sessions = sessionsOf(w.sessionIds ?? [])
        const showAll = expanded[w.workspaceId] === true
        const currentAt = sessions.findIndex((s) => s.id === current)
        const limit = showAll ? sessions.length : Math.max(SESSION_LIMIT, currentAt + 1)
        const active = current !== undefined && (w.sessionIds ?? []).includes(current)
        const folderIds = layout.entries.filter((entry) => entry.startsWith('f:')).map((entry) => entry.slice(2))
        const menuItems = [
          { label: t('newSession'), icon: icon('IconPlusOutlineRegular'), onSelect: () => api.startSession(w.workspaceId) },
          { label: t('rename'), icon: icon('IconEditOutlineRegular'), onSelect: () => setRenaming(key) },
          { sep: true },
          { label: t('moveTo') },
          ...folderIds
            .filter((id) => id !== parent)
            .map((id) => ({
              label: layout.folders[id].title,
              icon: icon('IconFolderCloseRegular'),
              onSelect: () => commit(toggleCollapsed(moveItem(layoutRef.current, key, { parent: id, index: Infinity }), 'f:' + id, false))
            })),
          { label: t('newFolder'), icon: h(FolderPlusIcon), onSelect: () => createFolder(w.workspaceId) },
          ...(parent === 'root' ? [] : [{ label: t('removeFromFolder'), onSelect: () => commit(moveItem(layoutRef.current, key, { parent: 'root', index: Infinity })) }])
        ]
        return h(
          'div',
          { key, 'data-block': key, 'data-parent': parent === 'root' ? 'root' : 'f:' + parent },
          h(
            'div',
            {
              className: 'dshcl-row',
              'data-flip': key,
              'data-collapsed': collapsed ? '' : undefined,
              'data-active': active ? '' : undefined,
              'data-menu': menu?.key === key ? '' : undefined,
              title: w.path ?? title,
              onPointerDown: (event) => beginPress(event, key, title, positionOf(layoutRef.current, key)),
              onClick: onRowClick(() => commit(toggleCollapsed(layoutRef.current, key))),
              onDoubleClick: () => setRenaming(key)
            },
            h('span', { className: 'dshcl-icon' }, icon(collapsed ? 'IconFolderCloseRegular' : 'IconFolderOpenRegular')),
            renaming === key
              ? h(RenameInput, {
                  initial: title,
                  onDone: (next) => {
                    setRenaming(null)
                    if (next) api.renameWorkspace(w.workspaceId, next).catch(fail(t('actionFailed')))
                  }
                })
              : h('span', { className: 'dshcl-title' }, title),
            h(
              'span',
              { className: 'dshcl-acts' },
              h('button', { type: 'button', className: 'dshcl-btn', 'aria-label': t('newSession'), title: t('newSession'), onClick: (event) => (event.stopPropagation(), api.startSession(w.workspaceId)) }, icon('IconPlusOutlineRegular')),
              h('button', { type: 'button', className: 'dshcl-btn', 'aria-label': t('more'), title: t('more'), onClick: openMenu(key, menuItems) }, icon('IconEllipsisOutlineRegular'))
            )
          ),
          collapsed ? null : sessions.slice(0, limit).map((s) => sessionRow(s)),
          !collapsed && sessions.length > SESSION_LIMIT && (showAll || limit < sessions.length)
            ? h(
                'div',
                {
                  key: 'more',
                  className: 'dshcl-row dshcl-more',
                  'data-flip': key + ':more',
                  onClick: onRowClick(() => setExpanded((state) => ({ ...state, [w.workspaceId]: !showAll })))
                },
                showAll ? t('showLess') : t('showMore')
              )
            : null
        )
      }

      // Insert the drop slot and hide the dragged block (folders and workspaces only).
      const arrange = (keys, parent) => {
        const dragKey = drag && !drag.key.startsWith('s:') ? drag.key : null
        const out = keys.filter((key) => key !== dragKey)
        const target = drag?.target
        if (dragKey && target && !target.into && target.parent === parent) out.splice(Math.min(target.index, out.length), 0, null)
        return out
      }
      const slot = (parent) => h('div', { key: 'slot:' + parent, className: 'dshcl-slot', 'data-flip': 'slot', 'data-placeholder': '' })

      const folderBlock = (folderId) => {
        const key = 'f:' + folderId
        const folder = layout.folders[folderId]
        const collapsed = layout.collapsed[key] === true
        const children = arrange(folder.children.map((id) => 'w:' + id), folderId)
        const dropInto = drag?.target?.into === true && drag.target.parent === folderId
        const menuItems = [
          { label: t('rename'), icon: icon('IconEditOutlineRegular'), onSelect: () => setRenaming(key) },
          { label: t('deleteFolder'), icon: icon('IconTrashOutlineRegular'), onSelect: () => commit(deleteFolder(layoutRef.current, folderId)) }
        ]
        return h(
          'div',
          { key, 'data-block': key, 'data-parent': 'root' },
          h(
            'div',
            {
              className: 'dshcl-row dshcl-section',
              'data-flip': key,
              'data-folder-head': folderId,
              'data-collapsed': collapsed ? '' : undefined,
              'data-drop-into': dropInto ? '' : undefined,
              'data-menu': menu?.key === key ? '' : undefined,
              onPointerDown: (event) => beginPress(event, key, folder.title, positionOf(layoutRef.current, key)),
              onClick: onRowClick(() => commit(toggleCollapsed(layoutRef.current, key))),
              onDoubleClick: () => setRenaming(key)
            },
            renaming === key
              ? h(RenameInput, {
                  initial: folder.title,
                  onDone: (title) => {
                    setRenaming(null)
                    if (title) commit(renameFolder(layoutRef.current, folderId, title))
                  }
                })
              : h('span', { className: 'dshcl-title', style: { flex: '0 1 auto' } }, folder.title),
            h('span', { className: 'dshcl-caret' }, icon('IconTriangleRightFillRegular', 10)),
            h('span', { style: { flex: 1 } }),
            collapsed ? h('span', { className: 'dshcl-meta' }, String(folder.children.length)) : null,
            h(
              'span',
              { className: 'dshcl-acts' },
              h('button', { type: 'button', className: 'dshcl-btn', 'aria-label': t('more'), title: t('more'), onClick: openMenu(key, menuItems) }, icon('IconEllipsisOutlineRegular'))
            )
          ),
          collapsed
            ? null
            : h(
                'div',
                { className: 'dshcl-children' },
                children.length === 0
                  ? h('div', { key: 'hint', className: 'dshcl-row dshcl-hint', 'data-flip': key + ':hint', 'data-folder-head': folderId }, t('dropIntoFolder'))
                  : children.map((child) => (child === null ? slot(folderId) : workspaceBlock(byWorkspace.get(child.slice(2)), folderId)))
              )
        )
      }

      if (!wide) return null

      // ---- body
      const dragging = drag !== null
      const draggingSession = dragging && drag.key.startsWith('s:')
      const pinnedSessions = (ws.pinnedSessionIds ?? []).map((id) => list.byId?.[id]).filter((s) => visible(s) && !s.blank)
      let body
      if (query !== null && query.trim() !== '') {
        const needle = query.trim().toLowerCase()
        const owner = new Map(items.flatMap((w) => (w.sessionIds ?? []).map((id) => [id, w])))
        const hits = Object.values(list.byId ?? {})
          .filter((s) => visible(s) && !s.blank)
          .filter((s) => titleOf(s).toLowerCase().includes(needle) || (owner.has(s.id) && workspaceTitle(owner.get(s.id)).toLowerCase().includes(needle)))
          .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
          .slice(0, 50)
        body = hits.length === 0 ? h('div', { className: 'dshcl-empty' }, t('noMatches')) : hits.map((s) => sessionRow(s, { static: true, meta: owner.has(s.id) ? workspaceTitle(owner.get(s.id)) : '' }))
      } else {
        const accounted = new Set(items.flatMap((w) => w.sessionIds ?? []))
        const ungrouped = sessionsOf((list.ids ?? []).filter((id) => !accounted.has(id)))
        const showPinned = pinnedSessions.length > 0 || (draggingSession && !pinned.has(drag.key.slice(2)))
        body = [
          showPinned
            ? h(
                'div',
                { key: 'pinned', 'data-pin-zone': '' },
                h('div', { className: 'dshcl-row dshcl-section dshcl-static', 'data-flip': 'pinned' }, h('span', { className: 'dshcl-title' }, t('pinned'))),
                draggingSession && !pinned.has(drag.key.slice(2))
                  ? h(
                      'div',
                      { className: 'dshcl-row dshcl-pin-drop', 'data-flip': 'pin-drop', 'data-over': drag.target?.pin ? '' : undefined },
                      h('span', { className: 'dshcl-icon' }, icon('IconPinOutlineRegular')),
                      h('span', { className: 'dshcl-title' }, t('dropHere'))
                    )
                  : null,
                pinnedSessions.map((s) => sessionRow(s))
              )
            : null,
          h(
            'div',
            { key: 'list', className: 'dshcl-list', 'data-list': '' },
            arrange(layout.entries, 'root').map((entry) =>
              entry === null ? slot('root') : entry.startsWith('f:') ? folderBlock(entry.slice(2)) : workspaceBlock(byWorkspace.get(entry.slice(2)), 'root')
            )
          ),
          ungrouped.length > 0
            ? h(
                'div',
                { key: 'ungrouped' },
                h('div', { className: 'dshcl-row dshcl-section dshcl-static', 'data-flip': 'ungrouped' }, h('span', { className: 'dshcl-title' }, t('ungrouped'))),
                ungrouped.map((s) => sessionRow(s))
              )
            : null,
          ready && items.length === 0 ? h('div', { key: 'empty', className: 'dshcl-empty' }, t('empty')) : null
        ]
      }

      const className = 'dshcl-root' + (dragging ? ' dshcl-dragging' : '') + (dragging && !draggingSession ? ' dshcl-dragging-group' : '')
      return h(
        'div',
        { className, onClickCapture: (event) => suppressClick.current && (event.stopPropagation(), event.preventDefault()) },
        h(
          'div',
          { className: 'dshcl-head' },
          query === null
            ? h('span', { className: 'dshcl-head-label' }, t('workspaces'))
            : h('input', {
                className: 'dshcl-search',
                autoFocus: true,
                placeholder: t('search'),
                value: query,
                onChange: (event) => setQuery(event.target.value),
                onKeyDown: (event) => event.key === 'Escape' && setQuery(null),
                onBlur: () => query.trim() === '' && setQuery(null)
              }),
          h('button', { type: 'button', className: 'dshcl-btn', 'aria-label': t('search'), title: t('search'), onClick: () => setQuery((q) => (q === null ? '' : null)) }, icon('IconSearchOutlineRegular')),
          h('button', { type: 'button', className: 'dshcl-btn', 'aria-label': t('newFolder'), title: t('newFolder'), onClick: () => createFolder() }, h(FolderPlusIcon)),
          flowAvailable
            ? h('button', { type: 'button', className: 'dshcl-btn', 'aria-label': t('addWorkspace'), title: t('addWorkspace'), disabled: flowBusy, onClick: () => setFlowOpen(true) }, icon('IconProjectAddOutlineRegular'))
            : null
        ),
        notice ? h('div', { className: 'dshcl-notice', role: 'status' }, notice) : null,
        h('div', { ref: scrollRef, className: 'dshcl-scroll' }, body),
        menu ? h(PopMenu, { anchor: menu.anchor, items: menu.items, onClose: closeMenu }) : null,
        renderSlot
          ? renderSlot('sidebar.workspaces.directoryFlow', {
              open: flowOpen,
              busy: flowBusy,
              onPicked: (path) => {
                setFlowBusy(true)
                api
                  .createWorkspace(path)
                  .then((workspace) => {
                    setFlowOpen(false)
                    api.startSession(workspace.workspaceId)
                  })
                  .catch((error) => {
                    setFlowOpen(false)
                    fail(error instanceof Error ? error.message : String(error))(error)
                  })
                  .finally(() => setFlowBusy(false))
              },
              onCancel: () => setFlowOpen(false),
              onError: (message) => {
                setFlowOpen(false)
                setNotice(message)
              }
            })
          : null
      )
    }

    // ---------------------------------------------------------------- plugin body
    const inject = ['slots', 'locale', 'sessions', 'workspaces', 'uiWorkspace']
    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'dsh-claude-layout: dictionaries')
      const sessions = ctx.get('sessions')
      const workspaces = ctx.get('workspaces')
      const ui = () => ctx.get('uiWorkspace')
      const flowHole = 'sidebar.workspaces.directoryFlow'
      const api = {
        open: (id) => ui().openSession(id),
        startSession: (workspaceId) => ui().startSession(workspaceId, { clearPreviousDraft: false }),
        pin: (id) => ui().pinSession(id),
        unpin: (id) => ui().unpinSession(id),
        archive: (id) => ui().archiveSession(id),
        renameSession: async (id, title) => {
          const result = await sessions.using(id, { source: 'workspaceOperation' }, (reference) => reference.binding.session.rename(title))
          if (!result.ok) throw new Error(result.error.message)
        },
        renameWorkspace: (id, title) => workspaces.rename(id, title),
        createWorkspace: (path) => workspaces.create({ path })
      }
      ctx.slots.inject('sidebar.workspaces', () =>
        ctx.slots.register(
          {
            name: 'sidebar.workspaces',
            // Lower priority renders, so this shadows the built-in Workspace browser while the plugin is on.
            // The directory-flow seat stays declared by that browser (root scope), so this one renders it too.
            priority: -1,
            locale: NS,
            inject: () => ({
              api,
              hooks: {
                directoryFlow: {
                  getSnapshot: () => ctx.slots.entries(flowHole).length > 0,
                  subscribe: (listener) => ctx.slots.subscribe(flowHole, listener)
                }
              }
            })
          },
          Browser
        )
      )
    }

    exports.inject = inject
    exports.apply = apply
    exports.reconcile = reconcile
    exports.positionOf = positionOf
    exports.moveItem = moveItem
    exports.addFolder = addFolder
    exports.renameFolder = renameFolder
    exports.deleteFolder = deleteFolder
    exports.toggleCollapsed = toggleCollapsed
    exports.createLayoutStore = createLayoutStore
    exports.ago = ago
    return module.exports
  }
})
