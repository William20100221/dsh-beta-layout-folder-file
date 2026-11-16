import { NS, TIMING } from './constants.js'
import { desiredOrder, planMoves, prune } from './model.js'

/**
 * Keeps DSH's saved workspace order matching the folders: each folder's members together, in folder
 * order, loose workspaces after them. Runs a little after every change (store, DSH's list, a drag) so
 * DSH's own drop handling has already landed; `setPin` records where the last drop meant to put a
 * workspace, consumed by the next successful pass. A pass requested while one is running re-arms it.
 */
export function createOrderSync({ workspaces, store, isDragging }) {
  let pin = null
  let normalizing = false
  let again = false
  let timer = 0
  const liveOrder = () => (workspaces.list.getSnapshot().items ?? []).map((item) => item.workspaceId)

  async function normalize() {
    const snap = workspaces.list.getSnapshot()
    if (snap.phase !== 'ready' || isDragging()) return
    if (normalizing) {
      again = true
      return
    }
    normalizing = true
    try {
      const order = liveOrder()
      const pruned = prune(store.get(), order)
      if (JSON.stringify(pruned) !== JSON.stringify(store.get())) store.set(pruned)
      const moves = planMoves(order, desiredOrder(order, pruned, pin))
      pin = null
      for (const [id, before] of moves) await workspaces.insertBefore(id, before ?? undefined)
    } catch (error) {
      console.warn(`[${NS}] reorder rejected:`, error)
    } finally {
      normalizing = false
      if (again) {
        again = false
        normalizeSoon()
      }
    }
  }
  const normalizeSoon = () => {
    clearTimeout(timer)
    timer = setTimeout(normalize, TIMING.NORMALIZE_MS)
  }

  return {
    liveOrder,
    setPin: (next) => {
      pin = next
    },
    normalizeSoon,
    /** Right away, for the moment after DSH's own drop has landed. */
    normalizeNow: () => {
      clearTimeout(timer)
      return normalize()
    },
    dispose: () => clearTimeout(timer)
  }
}
