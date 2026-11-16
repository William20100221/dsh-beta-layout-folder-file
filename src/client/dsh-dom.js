// Everything this plugin knows about DSH's sidebar markup, in one place. Verified against
// @deepseek-ai/dsh-client-ui-workspace 0.2.2-rc.1 (SessionTree / ProjectRowItem / SessionNodeItem).
// If a DSH update changes the list, this is the file to fix; meanwhile the overlay degrades to "no folders"
// and DSH's own list keeps working.
//
//   <div class="…sectionHeader">          header: label, search, [data-slot="sidebar.workspaces.directoryFlow"]
//   <div role="tree">                      the list; it is the scroller (overflow-y: auto)
//     <div style="--dsh-workspace-indent"> one section per root workspace
//       <span>                             hover-card anchor
//         <div data-row-key="workspace:ID" role="treeitem" draggable>  the workspace row
//       <div role="group">…</div>          nested workspaces (Workspace Tree view) — left alone
//       <span><div data-row-key="session:ID" tabindex="0" draggable aria-selected>  one wrapper + row per session
//       <button data-row-key="overflow:KEY">Show more</button>
//   The Workspace Tree view's "Ungrouped" bucket is a section whose row key is "workspace:" (empty id).
// Functions take elements and return elements; nothing here touches the document at import time.

export const SEL = {
  list: '[role="tree"]',
  section: '[role="tree"] > div',
  group: '[role="group"]',
  anyRow: '[data-row-key]',
  workspaceRow: '[data-row-key^="workspace:"]',
  sessionRow: '[data-row-key^="session:"]',
  selectedRow: '[data-row-key^="session:"][aria-selected="true"]',
  /** The row's title span: DSH's CSS-module class is hashed (`<hash>_title`), its local name is stable. */
  title: '[class*="_title"]',
  directoryFlow: '[data-slot="sidebar.workspaces.directoryFlow"]'
}

/** DSH's own drop indicators, hidden while this plugin's slot shows the drop position instead. */
export const DSH_DROP_INDICATORS = [
  '[class*="workspaceDropBefore"]::before',
  '[class*="workspaceDropAfter"]::after',
  '[class*="_dropBefore"]::before',
  '[class*="_dropAfter"]::after',
  '[class*="listTopDropIndicator"]'
]

export const rowKeyOf = (row) => row.dataset.rowKey ?? ''
export const workspaceIdOf = (row) => rowKeyOf(row).slice('workspace:'.length)
export const sessionIdOf = (row) => rowKeyOf(row).slice('session:'.length)
export const isWorkspaceRow = (row) => rowKeyOf(row).startsWith('workspace:')
export const isSessionRow = (row) => rowKeyOf(row).startsWith('session:')

/** The visible title of a row (last resort for the drag pill; the stores are asked first). */
export const textOf = (row) => (row.querySelector(SEL.title) ?? row).textContent.trim()

/** DSH's browser root: the parent of its directory-flow seat is the Workspaces header. */
export function findParts(doc) {
  const header = doc.querySelector(SEL.directoryFlow)?.parentElement ?? null
  const root = header?.parentElement ?? null
  const list = root?.querySelector(SEL.list) ?? null
  return { header, root, list }
}

/** The root workspace row of a list child, or null for the Ungrouped bucket and this plugin's own elements. */
const rootRowOf = (section) => {
  const row = section.querySelector(SEL.workspaceRow) // the root row's wrapper precedes any nested group
  return row !== null && workspaceIdOf(row) !== '' && row.closest(SEL.group) === null ? row : null
}

/** The root-level workspace section an element belongs to, or null. */
export function sectionOf(el, list) {
  const section = el.closest(SEL.section)
  return section !== null && section.parentElement === list && rootRowOf(section) !== null ? section : null
}

/** Root-level workspace sections in DOM order, with their row and workspace id. */
export function sectionsOf(list) {
  const out = []
  for (const section of list.children) {
    const row = rootRowOf(section)
    if (row !== null) out.push({ id: workspaceIdOf(row), section, row })
  }
  return out
}

/** DSH wraps each session row in a hover-card span; moving a row means moving that wrapper. */
export function wrapperOf(row) {
  const parent = row.parentElement
  return parent !== null && parent.matches(SEL.section) ? row : parent
}

/** The session row of a section child (the row itself, or inside its wrapper), or null. */
export const rowOfWrapper = (el) => (el.matches(SEL.sessionRow) ? el : el.querySelector(`:scope > ${SEL.sessionRow}`))

/** Session rows of one section with their wrappers, in DOM order. */
export function sessionWrappers(section) {
  const out = []
  for (const el of section.children) {
    const row = rowOfWrapper(el)
    if (row !== null) out.push({ el, row })
  }
  return out
}

/** The nearest scrolling ancestor (DSH's list itself scrolls), for drag auto-scroll. */
export function scrollerOf(el, win) {
  for (let node = el; node !== null && node !== win.document.body; node = node.parentElement) {
    const overflow = win.getComputedStyle(node).overflowY
    if (overflow === 'auto' || overflow === 'scroll') return node
  }
  return null
}
