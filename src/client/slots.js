/* global React, P */
import { ICON, NS, PKG } from './constants.js'
import { rpc } from './host.js'
import { FOLDER_PLUS_PATHS } from './icons.js'

// The React pieces: glyphs for this plugin's menu rows (DSH's `contextMenu.icon` slot) and the settings
// form on the plugin's page under Plugins (`plugins.bundle.config`). `React` and `P` (DSH's UI primitives)
// are bound by the build's prelude.

function FolderPlusIcon() {
  const h = React.createElement
  return h(
    'svg',
    { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
    ...FOLDER_PLUS_PATHS.map((d, i) => h('path', { key: i, d }))
  )
}

function SettingsForm({ t, view }) {
  const h = React.createElement
  const [auto, setAuto] = React.useState(null)
  React.useEffect(() => {
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

export function registerSlots(ctx) {
  const h = React.createElement
  // Menu icons get DSH's icon metadata as props; the primitives want none, so each is wrapped.
  const glyph = (Icon) => () => h(Icon, {})
  const icons = {
    [ICON.folder]: glyph(P.IconFolderCloseRegular),
    [ICON.folderPlus]: FolderPlusIcon,
    [ICON.remove]: glyph(P.IconCloseFillRegular),
    [ICON.rename]: glyph(P.IconEditOutlineRegular),
    [ICON.delete]: glyph(P.IconTrashOutlineRegular),
    [ICON.collapse]: glyph(P.IconChevronsUpDownOutlineRegular),
    [ICON.sparkle]: glyph(P.IconSparkleRegular),
    [ICON.download]: glyph(P.IconDownloadOutlineRegular),
    [ICON.add]: glyph(P.IconPlusOutlineRegular)
  }
  ctx.slots.inject('contextMenu.icon', function* () {
    for (const [key, Icon] of Object.entries(icons)) yield ctx.slots.register({ name: 'contextMenu.icon', key }, Icon)
  })
  ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({ name: 'plugins.bundle.config', key: PKG, locale: NS }, SettingsForm))
}
