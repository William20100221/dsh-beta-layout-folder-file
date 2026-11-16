// The folder model and the ordering maths. Pure functions over plain data; no DOM, no DSH.
//
// state = {
//   folders: [{ id, title, collapsed, members: [workspaceId] }],  // ordered; folders sit above loose workspaces
//   collapsedSessions: { [sessionId]: true }                       // folded fork trees
// }
// Member order inside a folder comes from DSH's own saved workspace order, so `members` is a set kept as an array.

export const EMPTY = { folders: [], collapsedSessions: {} }

export const folderOf = (state, workspaceId) => state.folders.find((folder) => folder.members.includes(workspaceId))

/** Put a workspace in a folder (or take it out with `folderId` null). */
export function assign(state, workspaceId, folderId) {
  return {
    ...state,
    folders: state.folders.map((folder) => {
      const members = folder.members.filter((id) => id !== workspaceId)
      if (folder.id === folderId) members.push(workspaceId)
      return { ...folder, members }
    })
  }
}

export function addFolder(state, id, title) {
  return { ...state, folders: [{ id, title, collapsed: false, members: [] }, ...state.folders] }
}

export function updateFolder(state, id, patch) {
  return { ...state, folders: state.folders.map((folder) => (folder.id === id ? { ...folder, ...patch } : folder)) }
}

/** Deleting a folder only ungroups its workspaces. */
export function deleteFolder(state, id) {
  return { ...state, folders: state.folders.filter((folder) => folder.id !== id) }
}

/** Move folder `id` before folder `beforeId` (null: to the end). */
export function moveFolder(state, id, beforeId) {
  const moving = state.folders.find((folder) => folder.id === id)
  if (moving === undefined || id === beforeId) return state
  const rest = state.folders.filter((folder) => folder.id !== id)
  const at = beforeId === null ? rest.length : rest.findIndex((folder) => folder.id === beforeId)
  rest.splice(at < 0 ? rest.length : at, 0, moving)
  return { ...state, folders: rest }
}

export function setAllCollapsed(state, collapsed) {
  return { ...state, folders: state.folders.map((folder) => ({ ...folder, collapsed })) }
}

/** Drop members whose workspace no longer exists. */
export function prune(state, liveIds) {
  const live = new Set(liveIds)
  return { ...state, folders: state.folders.map((folder) => ({ ...folder, members: folder.members.filter((id) => live.has(id)) })) }
}

export function toggleSessionCollapsed(state, sessionId) {
  const collapsedSessions = { ...(state.collapsedSessions ?? {}) }
  if (collapsedSessions[sessionId]) delete collapsedSessions[sessionId]
  else collapsedSessions[sessionId] = true
  return { ...state, collapsedSessions }
}

/** A folder named "📚 School" shows 📚 as its icon: split a leading emoji off the title. */
export function splitIcon(title) {
  const match = /^(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)\s*(.*)$/su.exec(title)
  return match ? { icon: match[1], text: match[2] } : { icon: '', text: title }
}

/**
 * The workspace order DSH should hold: each folder's members together (in folder order), then loose
 * workspaces. Inside a group the current order is kept, except a just-dropped workspace `pin`
 * ({ id, before }), placed before `before` in its group, or at the group's end when `before` is null
 * or elsewhere. This is what DSH's own drop would do, so the two never disagree.
 */
export function desiredOrder(order, state, pin) {
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
export function planMoves(order, target) {
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
 * Returns rows depth-first with their depth, whether each is the last child of its parent, and how many
 * children it has. A row whose parent is not in `ids` stays a root.
 */
export function treeOrder(ids, parentOf) {
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
    out.push({ id, depth, last, childCount: kids.length })
    kids.forEach((kid, i) => visit(kid, depth + 1, i === kids.length - 1))
  }
  roots.forEach((id) => visit(id, 0, false))
  return out
}
