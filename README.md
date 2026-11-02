# dsh-claude-layout

A [DeepSeek Harness](https://github.com/deepseek-ai) plugin that gives the sidebar a Claude-style Workspaces list:

- **Folders for workspaces.** Make a folder, give it a title, and put as many workspaces in it as you like (for example *School* holding *Maths*, *Physics* and *Chemistry*). Folders collapse, rename and delete; deleting a folder only ungroups its workspaces.
- **Drag and drop.** Drag a workspace onto a folder to file it, or between rows to reorder. Drag folders to reorder them. While you drag, the item lifts into a floating pill, the rest of the list dims, and rows slide aside to show where it will land.
- **Pinned section.** Drag a session to the top and a *Pinned · Drop here* zone appears; drop it there to pin it. Drag a pinned session back out to unpin it.
- **Sessions under each workspace**, newest first, with running / waiting / done dots and short times (`5m`, `3h`, `2d`). Hover a row for **⋯** (pin, rename, archive) or the workspace's **+** (new session).

Folder layout is saved in this app's browser storage, so it stays across restarts on this computer.

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

Removing the plugin brings back DSH's built-in Workspace list; your workspaces and sessions are never changed by this plugin, only how they are grouped on screen.

## What it doesn't do (yet)

- No view options menu (group by tree / flat list, manual ordering, show archived). Sessions are sorted by last update.
- Search filters by session and workspace title only, not by conversation content.
- The `Ctrl+K` search shortcut still targets DSH's built-in list, which this plugin hides.
- No fork or "copy session ID" in the row menu, and no delete-workspace action.

## How it works

`lib/client.js` registers a component into the sidebar's `sidebar.workspaces` seat at priority `-1`, which shadows the built-in browser while the plugin is on. It reads workspaces and sessions through DSH's own hooks and acts through the `uiWorkspace`, `workspaces` and `sessions` services, so pin, archive, rename and open behave exactly like the built-in list. The file is hand-written in DSH's client-bundle format, so there is no build step.

```sh
npm test
```

## License

MIT
