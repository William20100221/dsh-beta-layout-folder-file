# dsh-beta-layout-folder-file

**Claude-style folders, fork trees and drag-and-drop for the DeepSeek Harness sidebar.**

English | [中文](README.zh.md)

![License: MIT](https://img.shields.io/badge/license-MIT-blue) ![DSH 0.2](https://img.shields.io/badge/DeepSeek%20Harness-0.2.x-4d6bfe) ![No build step](https://img.shields.io/badge/build-none-brightgreen)

Lots of workspaces and forked chats turn DSH's sidebar into one long list. This plugin lets you group workspaces into folders, shows forks as a tree under the chat they came from, and makes dragging feel like Claude's sidebar. It doesn't replace anything: every row, button, menu and hover card is still DSH's own.

```
Workspaces                  🔍  📁+  ⚙  ＋
School ▾                                      ← your folder
   📂 Maths
        Calculus past papers           5h
        Complex numbers  ▾             9h     ← has forks
        ├ Complex numbers (fork)       1d
        └ Complex numbers (fork 2)     2d
   📁 Physics
Robotics ▸                          2         ← collapsed folder
📁 Default workspace
```

## Features

**Organise**
- 📁 **Folders for workspaces.** Give a folder any name (*School*, *Robotics*, *Clients*…) and put as many workspaces in it as you like. Folders collapse, rename, reorder and delete. Deleting a folder only ungroups it; nothing inside is lost.
- 🌳 **Fork tree.** A forked chat sits under the chat it came from, joined by a connector line. Click the ▾ to fold the forks away.

**Feel**
- ✋ **Claude-style dragging.** The item lifts into a floating pill, the list dims, rows slide apart around a dashed slot, and a folder lights up when you hover it. Drop on the slot and the item lands right there.
- 📜 **Scrolling titles.** Hover a title that's too long and it keeps scrolling back and forth, so you can read all of it.

**Do more** (in each chat's **⋯** menu)
- 📦 **Export as ZIP.** Saves the chat with its sub-chats and attached files to your computer.
- ✨ **Generate title.** The chat's own model reads the whole conversation and gives it a short title. DSH by itself only names a chat once, from the first message.
- ⚙️ **Auto titles** (optional). Turn on *Generate an AI title after every reply* on the plugin's page under **Plugins**, and titles stay up to date as the conversation moves on.

## Install

Open **PowerShell** and run:

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add github:William20100221/dsh-beta-layout-folder-file
```

Then **restart DeepSeek Harness**: quit it from the tray icon and open it again.

## Your first folder

1. Click the **folder-plus** button in the Workspaces header.
2. Type a name and press **Enter**.
3. Drag a workspace onto the folder header. To take it out again, drag it back among the loose workspaces.

## FAQ

**Does it change my chats or files?**
No. It only changes how workspaces are grouped and ordered in the sidebar, and chat titles when you ask it to (or turn on auto titles).

**Where is everything saved?**
Folders are saved in the app on this computer. Workspace order is saved by DSH itself, so other DSH screens, like the workspace picker, use the same order. The auto-title switch is saved in `~/.dsh/dsh-beta-layout-folder-file.json`.

**"Generate title" says there's nothing to summarise.**
The chat needs at least one message and reply first, so the plugin knows which model to ask.

**How do I remove it?**
Use **Uninstall** on the plugin's page under **Plugins**, or run:

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop remove dsh-beta-layout-folder-file
```

The sidebar goes straight back to normal.

## Good to know

- Folders and the fork tree appear in DSH's normal grouped view. The flat list and search results stay as DSH draws them.
- In **Workspace Tree** view, only top-level workspaces can go into folders.
- Folders always sit above loose workspaces.
- A generated title is kept: DSH's own first-message title won't overwrite it.

## For developers

The plugin has two halves and no build step; both are hand-written in DSH's plugin format.

- **Browser half (`lib/client.js`)** draws no UI of its own over DSH's list. It finds the Workspace list (`[role="tree"]` next to the `sidebar.workspaces.directoryFlow` seat) and does four things:
  - inserts folder headers, and tags member sections so CSS can indent or hide them;
  - moves forked chats under their source (`parentId`);
  - keeps each folder's workspaces together through DSH's `workspaces.insertBefore`;
  - restyles DSH's native drag events with a pill image and the dashed slot.

  It also adds two rows to `sidebar.workspaces.session.menu.item` and a form to `plugins.bundle.config`.
- **Host half (`index.js`)** registers `POST /api/dsh-beta-layout` on DSH's Connection for the setting and title generation, and listens for `turn/end` to run auto titles. Titles go through `@deepseek-ai/dsh-session-title-llm`, the helper DSH uses for its own titles, and are applied with `ctx.sessionTitle.rename`.

If a DSH update changes the sidebar's markup, folders and the tree simply stop showing, and DSH's list keeps working.

```sh
npm test
```

Issues and pull requests are welcome.

## License

MIT
