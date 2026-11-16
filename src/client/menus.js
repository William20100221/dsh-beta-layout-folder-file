import { FOLDER_TARGET, ICON, MENU_ORDER, NS } from './constants.js'
import { folderOf } from './model.js'

/**
 * Rows in DSH's own context menus (right-click, ⋯, Shift+F10), through its menu service:
 *   workspace rows → "Move to folder ›" with the folders, "New folder…" and "Remove from folder";
 *   session rows   → "Generate title" (disabled while running) and "Export as ZIP";
 *   folder headers → this plugin's own target family: Rename, Add a workspace, Collapse/Expand all, Delete.
 * `observe` sources re-resolve a menu while it is open when folders or titles change.
 */
export function registerMenus(ctx, { store, actions, sessions, titles, t, overlay }) {
  const register = (input, label) => ctx.effect(() => ctx.contextMenus.register(input), `${NS}: ${label} menu`)

  register(
    {
      id: 'beta-layout.move',
      target: 'workspace',
      order: MENU_ORDER.moveToFolder,
      observe: () => [store, ctx.locale],
      resolve: ({ workspaceId }) => {
        const state = store.get()
        const current = folderOf(state, workspaceId)
        const children = state.folders.map((folder) => ({
          id: 'to-' + folder.id,
          label: folder.title,
          icon: { key: ICON.folder },
          disabled: current?.id === folder.id,
          run: () => actions.moveToFolder(workspaceId, folder.id, { id: workspaceId, before: null })
        }))
        children.push({
          id: 'new',
          label: t('newFolderEllipsis'),
          icon: { key: ICON.folderPlus },
          separatorBefore: children.length > 0,
          run: () => overlay.newFolder(workspaceId)
        })
        if (current !== undefined)
          children.push({
            id: 'remove',
            label: t('removeFromFolder'),
            icon: { key: ICON.remove },
            separatorBefore: true,
            run: () => actions.moveToFolder(workspaceId, null, { id: workspaceId, before: null })
          })
        return [{ id: 'move', label: t('moveToFolder'), icon: { key: ICON.folder }, separatorBefore: true, children }]
      }
    },
    'move to folder'
  )

  register(
    {
      id: 'beta-layout.title',
      target: 'session',
      order: MENU_ORDER.generateTitle,
      observe: () => [sessions.list, titles.running, ctx.locale],
      resolve: ({ sessionId }) => {
        const session = sessions.list.getSnapshot().byId?.[sessionId]
        const busy = titles.isRunning(sessionId)
        return [
          {
            id: 'generate',
            label: busy ? t('generating') : t('generateTitle'),
            icon: { key: ICON.sparkle },
            disabled: busy || session === undefined || session.blank === true,
            run: () => titles.generate(sessionId)
          }
        ]
      }
    },
    'generate title'
  )

  register(
    {
      id: 'beta-layout.export',
      target: 'session',
      order: MENU_ORDER.exportZip,
      observe: () => [sessions.list, ctx.locale],
      resolve: ({ sessionId }) => {
        const session = sessions.list.getSnapshot().byId?.[sessionId]
        return [{ id: 'export', label: t('export'), icon: { key: ICON.download }, disabled: session === undefined || session.blank === true, run: () => titles.exportZip(sessionId) }]
      }
    },
    'export'
  )

  register(
    {
      id: 'beta-layout.folder',
      target: FOLDER_TARGET,
      order: 100,
      observe: () => [store, ctx.locale],
      resolve: ({ folderId }) => {
        if (actions.folder(folderId) === undefined) return []
        const anyOpen = store.get().folders.some((folder) => !folder.collapsed)
        return [
          { id: 'rename', label: t('rename'), icon: { key: ICON.rename }, run: () => overlay.renameFolder(folderId) },
          { id: 'add', label: t('addWorkspaceHere'), icon: { key: ICON.add }, run: () => overlay.addWorkspaceTo(folderId) },
          { id: 'all', label: anyOpen ? t('collapseAll') : t('expandAll'), icon: { key: ICON.collapse }, separatorBefore: true, run: () => actions.setAllCollapsed(anyOpen) },
          { id: 'delete', label: t('deleteFolder'), icon: { key: ICON.delete }, danger: true, separatorBefore: true, run: () => actions.deleteFolder(folderId) }
        ]
      }
    },
    'folder'
  )

  /** Open the folder menu at a point; a second gesture on the same folder closes it, like DSH's rows. */
  const openFolderMenu = (folderId, point) => {
    const active = ctx.contextMenus.active?.getSnapshot?.() ?? null
    if (active?.kind === FOLDER_TARGET && active.value?.folderId === folderId) ctx.contextMenus.close()
    else ctx.contextMenus.open({ kind: FOLDER_TARGET, value: { folderId } }, point)
  }
  return { openFolderMenu }
}
