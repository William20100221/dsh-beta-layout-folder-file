# dsh-beta-layout-folder-file

A [DeepSeek Harness](https://github.com/deepseek-ai) plugin that gives the Workspaces sidebar Claude-style organisation, on top of DSH's own list. Every workspace row, session row, hover button, menu, hover card, search and view option is still DSH's built-in UI; the plugin only adds to it.

## What it adds

- **Folders for workspaces.** Click the folder-plus button in the Workspaces header, type a title, and you have a folder (for example *School*). Drag a workspace onto a folder header to put it in; drop it among a folder's workspaces and it joins that folder; drop it among the loose workspaces and it leaves. Folders collapse, rename, delete (which only ungroups) and reorder by dragging their headers.
- **A tree for forked sessions.** A forked session nests under the session it was forked from, with a connector line, and the source row gets a ▾ caret that folds its forks.
- **Drag effects.** While dragging, the row becomes a floating pill, the rest of the list dims, the lifted row collapses, rows slide apart around a dashed slot where the drop will land, and a folder under the pointer lights up. Works for workspaces, sessions and folders; dropping on the slot lands exactly there.
- **Scrolling titles.** A title too long for the sidebar scrolls while you hover it, as in DSH, and then keeps bouncing between its two ends instead of stopping at the end.
- **Export as ZIP** in a session's ⋯ menu: downloads the session, its sub-sessions and attached files through DSH's own session export.
- **Generate title** in a session's ⋯ menu: asks the session's current model for a short title from the whole conversation and sets it. DSH itself only titles a session once, from its first message.
- **Auto titles**, off by default: on the plugin's page under **Plugins**, turn on *Generate an AI title after every reply* and every finished turn retitles the session the same way.

Folder names and membership are saved in this app's browser storage on this computer; the order of workspaces is saved in DSH itself; the auto-title setting is saved in `~/.dsh/dsh-beta-layout-folder-file.json`.

## Install

DSH installs plugins with its own CLI. In PowerShell:

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add github:William20100221/dsh-beta-layout-folder-file
```

Then restart DSH (quit from the tray icon and reopen).

Remove it the same way:

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop remove dsh-beta-layout-folder-file
```

The plugin never changes workspaces or session contents, only how they are grouped and ordered in the sidebar, and session titles when you ask for them.

## Limits

- Folders and the fork tree show in DSH's grouped view. In the flat list and in search results they are hidden (the sessions and workspaces are still there).
- In the **Workspace Tree** view only top-level workspaces can be filed.
- Folders always sit above loose workspaces.
- Generating a title needs the session to have at least one exchange, so a model route is known. Auto titles pin the title, so DSH's own first-message title no longer replaces it.

## How it works

The browser half (`lib/client.js`) registers no replacement UI. It finds DSH's Workspace list (`[role="tree"]` next to the `sidebar.workspaces.directoryFlow` seat), inserts folder headers before each folder's first workspace, tags member sections so CSS can indent or hide them, moves forked sessions' rows under their source, and calls DSH's `workspaces.insertBefore` to keep each folder's workspaces together. Capture-phase listeners on DSH's native drag events set the pill drag image, place the dashed slot and record which folder a workspace was dropped into. It also registers two rows in DSH's `sidebar.workspaces.session.menu.item` seat and a form in `plugins.bundle.config`.

The host half (`index.js`) registers one Connection route, `POST /api/dsh-beta-layout`, for the setting and for title generation, and listens to `turn/end` for auto titles. Titles go through `@deepseek-ai/dsh-session-title-llm`, the same helper DSH's own first-message titles use, and are set with `ctx.sessionTitle.rename`.

If a DSH update changes the list's markup, the folders and tree stop showing and DSH's list keeps working as normal. No build step: the files are hand-written in DSH's client-bundle format.

```sh
npm test
```

## License

MIT
