// Inline SVG for the plugin's own DOM (DSH's icon components are React, used only in slots.js).
// Folder-plus and plus paths from Lucide (ISC license, https://lucide.dev).

export const FOLDER_PLUS_PATHS = [
  'M12 10v6',
  'M9 13h6',
  'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z'
]

/** A 24-box stroke icon as markup. */
export const strokeSvg = (paths, size = 16) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths.map((d) => `<path d="${d}"/>`).join('')}</svg>`

export const SVG = {
  folderPlus: strokeSvg(FOLDER_PLUS_PATHS),
  plus: strokeSvg(['M5 12h14', 'M12 5v14']),
  caret: '<svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true"><path d="M2 1l4 3-4 3z" fill="currentColor"/></svg>',
  ellipsis:
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>'
}
