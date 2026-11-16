import { addFolder, assign, deleteFolder, folderOf, moveFolder, setAllCollapsed, toggleSessionCollapsed, updateFolder } from './model.js'
import { uid } from './util.js'

/**
 * Every change to the folder state goes through here: one place for undo notices and for telling the
 * order sync where a dropped workspace should land. `notify(text, success, action?)` is DSH's shared toast.
 * Undo is an inverse operation against the state at the time it is clicked, not a snapshot, so edits made
 * meanwhile (a new folder, a fold, a rename) survive it.
 */
export function createActions({ store, t, notify, orderSync }) {
  const folder = (id) => store.get().folders.find((entry) => entry.id === id)
  const commit = (next, text, undo) => {
    store.set(next)
    if (text) notify(text, true, { label: t('undo'), run: undo, failureLabel: t('undoFailed') })
  }
  return {
    folder,
    /**
     * File `workspaceId` into `folderId` (null: take it out). `pin` ({ id, before }) is where DSH should place
     * it; without one it goes to the end of its group. A drop inside the folder it is already in is a reorder.
     */
    moveToFolder(workspaceId, folderId, pin) {
      const target = folderId === null ? null : (folder(folderId) ?? null)
      if (folderId !== null && target === null) return
      orderSync.setPin(pin ?? { id: workspaceId, before: null })
      const from = folderOf(store.get(), workspaceId) ?? null
      if (from === target) {
        orderSync.normalizeSoon()
        return
      }
      let next = assign(store.get(), workspaceId, folderId)
      if (target !== null) next = updateFolder(next, target.id, { collapsed: false })
      commit(next, target !== null ? `${t('movedTo')} ${target.title}` : t('removedFromFolder'), () => {
        // Back where it came from, unless that folder is gone meanwhile; then loose.
        orderSync.setPin(null)
        store.set(assign(store.get(), workspaceId, from !== null && folder(from.id) !== undefined ? from.id : null))
      })
    },
    /** A new folder at the top, optionally with `workspaceId` already in it. Returns its id. */
    createFolder(title, workspaceId) {
      const id = uid()
      let next = addFolder(store.get(), id, title)
      if (workspaceId !== undefined) {
        orderSync.setPin({ id: workspaceId, before: null })
        next = assign(next, workspaceId, id)
      }
      store.set(next)
      return id
    },
    renameFolder(id, title) {
      const clean = title.trim()
      if (folder(id) !== undefined && clean !== '') store.set(updateFolder(store.get(), id, { title: clean }))
    },
    /** Deleting a folder only ungroups its workspaces, and can be undone. */
    deleteFolder(id) {
      const entry = folder(id)
      if (entry === undefined) return
      const index = store.get().folders.indexOf(entry)
      commit(deleteFolder(store.get(), id), `${t('folderDeleted')}: ${entry.title}`, () => {
        const state = store.get()
        if (state.folders.some((other) => other.id === id)) return
        // Members filed elsewhere meanwhile stay there.
        const members = entry.members.filter((workspaceId) => folderOf(state, workspaceId) === undefined)
        const folders = [...state.folders]
        folders.splice(Math.min(index, folders.length), 0, { ...entry, members })
        store.set({ ...state, folders })
      })
    },
    /** Put folder `movingId` before or after folder `targetId`. */
    reorderFolder(movingId, targetId, half) {
      const others = store.get().folders.filter((entry) => entry.id !== movingId)
      const at = others.findIndex((entry) => entry.id === targetId)
      if (at < 0) return
      store.set(moveFolder(store.get(), movingId, half === 'after' ? (others[at + 1]?.id ?? null) : targetId))
    },
    setFolderCollapsed(id, collapsed) {
      const entry = folder(id)
      if (entry !== undefined && entry.collapsed !== collapsed) store.set(updateFolder(store.get(), id, { collapsed }))
    },
    toggleFolder(id) {
      const entry = folder(id)
      if (entry !== undefined) store.set(updateFolder(store.get(), id, { collapsed: !entry.collapsed }))
    },
    setAllCollapsed(collapsed) {
      store.set(setAllCollapsed(store.get(), collapsed))
    },
    toggleSessionCollapsed(sessionId) {
      store.set(toggleSessionCollapsed(store.get(), sessionId))
    }
  }
}
