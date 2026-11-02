# dsh-claude-layout

A [DeepSeek Harness](https://github.com/deepseek-ai) plugin that adds **folders** to the sidebar's Workspaces list, with Claude-style drag effects. DSH's own list stays exactly as it is: every workspace row, session row, hover button, menu, hover card, search and view option is DSH's built-in UI.

- **Folders for workspaces.** Click the folder-plus button in the Workspaces header, type a title, and you have a folder (for example *School*). Folders collapse, rename, delete and reorder; deleting a folder only ungroups its workspaces.
- **Filing by drag.** Drag a workspace onto a folder header to put it in that folder. Drop it among a folder's workspaces and it joins that folder; drop it among the loose workspaces and it leaves. Drag a folder header to reorder folders.
- **Drag effects.** While dragging, the item becomes a floating pill, the rest of the list dims, the lifted row fades, and the folder under the pointer lights up. DSH's own insert line and settle animation still show where it lands.

Folders sit above loose workspaces. Their order is kept in DSH's own saved workspace order, so other DSH screens (like the workspace picker on the new-session page) list them in the same order. Folder names and membership are saved in this app's browser storage on this computer.

## Install

DSH installs plugins with its own CLI. In PowerShell:

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add github:William20100221/dsh-claude-layout
```

Then restart DSH (quit from the tray icon and reopen).

Remove it the same way:

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop remove dsh-claude-layout
```

The plugin never changes workspaces or sessions themselves, only how they are grouped and ordered in the sidebar.

## Limits

- Folders show in DSH's grouped view. In the flat list and in search results they are hidden (the workspaces are still there).
- In the **Workspace Tree** view only top-level workspaces can be filed.
- Folders always sit above loose workspaces.

## How it works

`lib/client.js` doesn't register any UI of its own into DSH's slots. It finds DSH's Workspace list (`[role="tree"]` next to the `sidebar.workspaces.directoryFlow` seat), inserts folder headers before each folder's first workspace, tags member sections so CSS can indent or hide them, and calls DSH's `workspaces.insertBefore` to keep each folder's workspaces together. A capture-phase listener on DSH's native drag events sets the pill drag image and records which folder a workspace was dropped into. If a DSH update changes that list, the folders stop showing and DSH's list keeps working as normal.

The file is hand-written in DSH's client-bundle format, so there is no build step.

```sh
npm test
```

## License

MIT
