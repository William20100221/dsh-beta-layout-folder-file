import { createActions } from './actions.js'
import { NS } from './constants.js'
import { createDrag } from './drag.js'
import { createKeyboard } from './keyboard.js'
import { en, zh } from './locale.js'
import { createMarquee } from './marquee.js'
import { registerMenus } from './menus.js'
import { createOrderSync } from './order-sync.js'
import { createOverlay } from './overlay.js'
import { registerSlots } from './slots.js'
import { createStore } from './store.js'
import { createTitles } from './titles.js'

// The plugin body DSH's client loader calls. Needs DSH ≥ 0.2.2 (the context-menu service).
export const inject = ['locale', 'workspaces', 'sessions', 'slots', 'contextMenus']

export function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { en, zh }), `${NS}: dictionaries`)
  if (typeof document === 'undefined') return
  const doc = document
  const win = window
  const storage = typeof localStorage === 'undefined' ? undefined : localStorage
  const { workspaces, sessions } = ctx
  const t = ctx.locale.bind(NS)
  const notify = (text, success, action) => ctx.contextMenus.notify(text, success, action)

  const store = createStore(storage)
  let drag = null
  const orderSync = createOrderSync({ workspaces, store, isDragging: () => drag?.isDragging() ?? false })
  const actions = createActions({ store, t, notify, orderSync })
  const overlay = createOverlay({ doc, win, storage, workspaces, sessions, store, actions, orderSync, t })
  const titles = createTitles({ doc, sessions, notify, t })
  const menus = registerMenus(ctx, { store, actions, sessions, titles, t, overlay })
  overlay.setMenuOpener(menus.openFolderMenu)
  drag = createDrag({ doc, win, getList: overlay.getList, folders: overlay.folders, actions, store, orderSync, labelOf: overlay.labelOf })
  overlay.setDragging(drag.isDragging)
  const marquee = createMarquee({ doc, win })
  const keyboard = createKeyboard({ doc, getList: overlay.getList })
  registerSlots(ctx)

  ctx.effect(
    () => () => {
      keyboard.dispose()
      marquee.dispose()
      drag.dispose()
      overlay.dispose()
      orderSync.dispose()
    },
    `${NS}: sidebar`
  )
}
