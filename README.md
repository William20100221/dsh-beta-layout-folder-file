# dsh-beta-layout-folder-file

**Claude-style folders, fork trees and drag-and-drop for the DeepSeek Harness sidebar.**

English | [中文](README.zh.md)

![License: MIT](https://img.shields.io/badge/license-MIT-blue) ![DSH 0.2.2](https://img.shields.io/badge/DeepSeek%20Harness-0.2.2%2B-4d6bfe) ![No build step needed to install](https://img.shields.io/badge/install-no%20build-brightgreen)

Lots of workspaces and forked chats turn DSH's sidebar into one long list. This plugin lets you group workspaces into folders, shows forks as a tree under the chat they came from, and makes dragging feel like Claude's sidebar. DSH's own rows, menus, search and hover cards stay exactly as they are; the plugin only adds to them.

```
Workspaces                  🔍  📁+  ⚙  ＋
📚 School ▾                                   ← your folder (a leading emoji becomes its icon)
   📂 Maths
        Calculus past papers           5h
        Complex numbers  ▾             9h     ← has forks
        ├ Complex numbers (fork)       1d
        └ Complex numbers (fork 2)     2d
   📁 Physics
Robotics ▸                          2         ← collapsed folder, 2 workspaces
📁 Default workspace
```

## Features

**Organise**
- 📁 **Folders for workspaces.** Make a folder with the folder-plus button, or right-click a workspace → **Move to folder › New folder…**. Give it any name; start the name with an emoji to give it an icon. Folders collapse, rename (double-click or F2), reorder by dragging their headers, and delete; deleting only ungroups.
- 🖱️ **Move to folder** from the workspace's own right-click / ⋯ menu, with **Remove from folder**: no dragging needed.
- ➕ **Add a workspace straight into a folder** with the **+** on its header (or its menu): DSH's folder picker opens and the new workspace lands in that folder.
- 🌳 **Fork tree.** A forked chat sits under the chat it came from, joined by a connector line. The ▾ on the source folds its forks and shows how many are hidden.
- ↩️ **Undo.** Every move and folder deletion shows a toast with **Undo**.
- ⌥ **Alt+click** a folder header to fold or unfold all folders at once (also in the folder's menu).

**Feel**
- ✋ **Claude-style dragging.** The item lifts into a floating pill, the list dims, rows slide apart around a dashed slot where the drop will land, and a folder lights up when you hover it. Hover a **collapsed** folder while dragging and it springs open; drag near the top or bottom edge and the list scrolls.
- 📜 **Scrolling titles.** Hover (or focus) a title that's too long and it scrolls to the end and back, twice, so you can read all of it.
- ⌨️ **Keyboard.** Tab to a folder header; Enter/Space folds it, ←/→ fold/unfold, F2 renames, Delete removes it (with Undo), ↑/↓/Home/End walk the list. Shift+F10 or right-click opens the folder's menu. Works with a screen reader and on touch screens (long-press for the menu).

**Do more** (in each chat's **⋯** / right-click menu)
- 📦 **Export as ZIP.** Saves the chat with its sub-chats and attached files to your computer, through DSH's own export.
- ✨ **Generate title.** The chat's own model reads the whole conversation and gives it a short title. DSH by itself names a chat once, from its first message. Greyed out on chats that haven't started.
- ⚙️ **Auto titles** (optional). Turn on *Generate an AI title after every reply* on the plugin's page under **Plugins**. A title you typed yourself is never replaced, and a title that still fits is kept rather than churned.

## Install

Needs DeepSeek Harness **0.2.2 or newer**. Open **PowerShell** and run:

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add github:William20100221/dsh-beta-layout-folder-file
```

Then **restart DeepSeek Harness**: quit it from the tray icon and open it again.

## Your first folder

1. Click the **folder-plus** button in the Workspaces header (or right-click a workspace → **Move to folder › New folder…**).
2. Type a name and press **Enter**.
3. Drag a workspace onto the folder header, or use **Move to folder** in its menu. To take it out, drag it back among the loose workspaces or choose **Remove from folder**.

## FAQ

**Does it change my chats or files?**
No. It only changes how workspaces are grouped and ordered in the sidebar, and chat titles when you ask it to (or turn on auto titles).

**Where is everything saved?**
Folders are saved in the app on this computer. Workspace order is saved by DSH itself, so other DSH screens, like the workspace picker, use the same order. The auto-title switch, and the last title the plugin gave each session (so a title you typed yourself is recognised and left alone), are saved in `~/.dsh/dsh-beta-layout-folder-file.json`.

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
- Titles the plugin generates are pinned, so DSH's own first-message title won't overwrite them.

## For developers

```
src/client/   the browser half as plain ES modules (DOM-free: constants, dsh-dom, model, store, host, util;
              features: actions, order-sync, folders, tree, drag, marquee, keyboard, titles, menus, slots, overlay)
src/host/     the host half's pure parts (settings file, title framing)
index.js      the host entry: one Connection route and the auto-title listener
lib/client.js GENERATED from src/client by scripts/build.js — commit it; DSH loads it as one script
```

`node scripts/build.js` rebuilds the bundle; `npm test` checks it is current and runs the unit tests (no DSH needed). Everything the plugin assumes about DSH's markup is in `src/client/dsh-dom.js`.

## License

MIT
