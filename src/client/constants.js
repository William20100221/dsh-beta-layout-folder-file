// Names, keys and tuning constants shared by the browser half. DOM-free.

/** Package name: also the loader id, the `data-plugin` tag, the host entry's name and the settings file. */
export const PKG = 'dsh-beta-layout-folder-file'
/** Locale namespace and log prefix. */
export const NS = 'dsh-beta-layout'
/** Document-relative route to the host half (index.js registers '/api/dsh-beta-layout'). */
export const ROUTE = 'api/dsh-beta-layout'
/** Frozen: folders made with 0.2.0 live under this key, and 0.1.0's under LEGACY_STORAGE_KEY. */
export const STORAGE_KEY = 'dsh-claude-layout:v2'
export const LEGACY_STORAGE_KEY = 'dsh-claude-layout:v1'
/** Set once the first-run hint has been dismissed. */
export const HINT_KEY = 'dsh-claude-layout:hint'
/** Frozen DOM/CSS prefix (from the plugin's first name); every element and class this plugin adds starts with it. */
export const CSS_PREFIX = 'dshcl'

/** Context-menu target kind for folder headers: a target family of this plugin's own. */
export const FOLDER_TARGET = 'dsh-beta-layout.folder'
/** Icon keys registered in DSH's `contextMenu.icon` slot. */
export const ICON = {
  folder: 'dsh-beta-layout.folder',
  folderPlus: 'dsh-beta-layout.folder-plus',
  remove: 'dsh-beta-layout.remove',
  rename: 'dsh-beta-layout.rename',
  delete: 'dsh-beta-layout.delete',
  collapse: 'dsh-beta-layout.collapse',
  sparkle: 'dsh-beta-layout.sparkle',
  download: 'dsh-beta-layout.download',
  add: 'dsh-beta-layout.add'
}
/** Where this plugin's rows sit in DSH's menus (DSH: workspace rename 100 / delete 300; session fork 300 / copy id 450 / archive 600). */
export const MENU_ORDER = { moveToFolder: 150, generateTitle: 350, exportZip: 500 }

export const TIMING = {
  SYNC_MS: 16, // batch DOM changes from one React commit; a timer, not rAF, which pauses while the window is hidden
  NORMALIZE_MS: 350, // after DSH's own drop handler and the 16 ms sync have both run
  POLL_MS: 1000, // re-find DSH's list after it remounts (flat list, search, sidebar rail)
  SPRING_MS: 600, // hovering a collapsed folder while dragging opens it after this long (Finder's default is similar)
  MARQUEE_HOLD_MS: 700, // pause at each end of a scrolling title
  MARQUEE_PX_PER_MS: 0.03, // DSH's own title scroll speed, kept so the bounce matches it
  ADD_TO_FOLDER_WINDOW_MS: 60000 // after '+' on a folder, a workspace added within this window lands in that folder
}
export const LAYOUT = {
  MARQUEE_MIN_RANGE_PX: 8, // DSH's own threshold for scrolling a clipped title
  MARQUEE_ROUND_TRIPS: 2, // then the title rests at its start again
  DRAG_IMAGE_OFFSET: [24, 15], // the pill sits just under and right of the pointer, like Claude's
  AUTOSCROLL_BAND_PX: 36, // distance from the list's edge where dragging starts to scroll it
  AUTOSCROLL_MAX_PX: 14, // per frame
  ONBOARD_MIN_WORKSPACES: 4 // the first-run hint only shows when folders would actually help
}
