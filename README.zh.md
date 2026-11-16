# dsh-beta-layout-folder-file

**为 DeepSeek Harness 侧栏带来 Claude 风格的文件夹、分支树和拖拽体验。**

[English](README.md) | 中文

![License: MIT](https://img.shields.io/badge/license-MIT-blue) ![DSH 0.2.2](https://img.shields.io/badge/DeepSeek%20Harness-0.2.2%2B-4d6bfe) ![安装无需构建](https://img.shields.io/badge/install-no%20build-brightgreen)

工作区和分支会话一多，DSH 的侧栏就变成一条长长的列表。这个插件可以把工作区归入文件夹，把分支会话以树形挂在它们的来源会话下面，并让拖拽的手感接近 Claude 的侧栏。DSH 自己的行、菜单、搜索和悬浮卡片原样保留，插件只是在上面做加法。

```
工作区                        🔍  📁+  ⚙  ＋
📚 学校 ▾                                     ← 你的文件夹（名字以 emoji 开头即为图标）
   📂 数学
        微积分真题                      5h
        复数  ▾                          9h     ← 有分支
        ├ 复数 (fork)                    1d
        └ 复数 (fork 2)                  2d
   📁 物理
机器人 ▸                              2         ← 折叠的文件夹，内含 2 个工作区
📁 默认工作区
```

## 功能

**整理**
- 📁 **工作区文件夹。** 点击“新建文件夹”按钮，或右键工作区 → **移动到文件夹 › 新建文件夹…**。名字随意；以 emoji 开头，它就成为文件夹图标。文件夹可折叠、重命名（双击或 F2）、拖动标题重新排序、删除（删除只是取消分组）。
- 🖱️ **移动到文件夹**：在工作区自带的右键 / ⋯ 菜单里，含“移出文件夹”，不必拖拽。
- ➕ **直接在文件夹里添加工作区**：点标题上的 **+**（或菜单项），DSH 的选目录流程打开后，新工作区会落在该文件夹里。
- 🌳 **分支树。** 分支会话挂在来源会话下面，用连接线相连；来源会话上的 ▾ 可以折叠分支，并显示隐藏的数量。
- ↩️ **撤销。** 每次移动和删除文件夹都会出现带 **撤销** 的提示。
- ⌥ **Alt+点击** 文件夹标题可一次折叠或展开全部文件夹（菜单里也有）。

**手感**
- ✋ **Claude 风格拖拽。** 被拖的项变成浮动的药丸，列表变暗，行会在落点处让出一个虚线槽位，悬停的文件夹会高亮。拖到**折叠的**文件夹上停留片刻会自动展开；拖到列表上下边缘会自动滚动。
- 📜 **滚动标题。** 悬停（或聚焦）过长的标题，它会滚到末尾再滚回来，共两趟，方便读完。
- ⌨️ **键盘。** Tab 到文件夹标题：Enter/空格折叠，←/→ 折叠/展开，F2 重命名，Delete 删除（可撤销），↑/↓/Home/End 在列表中移动。Shift+F10 或右键打开文件夹菜单。支持读屏软件和触屏（长按打开菜单）。

**更多**（在每个会话的 **⋯** / 右键菜单中）
- 📦 **导出为 ZIP。** 通过 DSH 自己的导出功能，把会话及其子会话和附件保存到本机。
- ✨ **生成标题。** 由会话当前使用的模型通读整段对话，给出一个简短标题。DSH 自己只会根据第一条消息命名一次。未开始的会话中此项为灰色。
- ⚙️ **自动标题**（可选）。在 **插件** 页中本插件的页面上打开“每次回复后自动生成 AI 标题”。你自己输入的标题不会被替换；仍然贴切的标题也会被保留，不会反复改动。

## 安装

需要 DeepSeek Harness **0.2.2 或更新版本**。打开 **PowerShell** 运行：

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add github:William20100221/dsh-beta-layout-folder-file
```

然后**重启 DeepSeek Harness**：从托盘图标退出，再重新打开。

## 第一个文件夹

1. 点击工作区标题栏里的**新建文件夹**按钮（或右键工作区 → **移动到文件夹 › 新建文件夹…**）。
2. 输入名字，按 **Enter**。
3. 把工作区拖到文件夹标题上，或在它的菜单里选**移动到文件夹**。想移出来，就把它拖回松散的工作区中间，或选择**移出文件夹**。

## 常见问题

**它会改动我的会话或文件吗？**
不会。它只改变工作区在侧栏里的分组和顺序，以及你主动要求（或开启自动标题）时的会话标题。

**数据保存在哪里？**
文件夹保存在本机的应用数据里；工作区顺序由 DSH 自己保存，所以工作区选择器等其他界面的顺序也一致；自动标题开关，以及插件最后一次为每个会话生成的标题（用来识别并保留你自己输入的标题），保存在 `~/.dsh/dsh-beta-layout-folder-file.json`。

**“生成标题”提示没有可总结的内容。**
会话需要至少有一条消息和一次回复，插件才知道该问哪个模型。

**怎么卸载？**
在 **插件** 页中本插件的页面上点 **卸载**，或运行：

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop remove dsh-beta-layout-folder-file
```

侧栏会立即恢复原样。

## 须知

- 文件夹和分支树显示在 DSH 的常规分组视图中；平铺列表和搜索结果保持 DSH 原样。
- 在 **工作区树** 视图中，只有顶层工作区可以放进文件夹。
- 文件夹总是排在松散的工作区上方。
- 插件生成的标题会被固定，DSH 自己的首条消息标题不会覆盖它。

## 开发者

```
src/client/   浏览器端，普通 ES 模块（无 DOM：constants、dsh-dom、model、store、host、util；
              功能：actions、order-sync、folders、tree、drag、marquee、keyboard、titles、menus、slots、overlay）
src/host/     主机端的纯函数部分（设置文件、标题拼接）
index.js      主机端入口：一个 Connection 路由和自动标题监听
lib/client.js 由 scripts/build.js 从 src/client 生成，需要提交；DSH 把它作为单个脚本加载
```

`node scripts/build.js` 重新生成打包文件；`npm test` 检查它是否为最新并运行单元测试（不需要 DSH）。插件对 DSH 侧栏结构的全部假设都写在 `src/client/dsh-dom.js` 里。

## 许可证

MIT
