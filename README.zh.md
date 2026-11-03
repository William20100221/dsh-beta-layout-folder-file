# dsh-beta-layout-folder-file

**为 DeepSeek Harness 侧栏带来 Claude 风格的文件夹、分支树和拖拽体验。**

[English](README.md) | 中文

![License: MIT](https://img.shields.io/badge/license-MIT-blue) ![DSH 0.2](https://img.shields.io/badge/DeepSeek%20Harness-0.2.x-4d6bfe) ![No build step](https://img.shields.io/badge/build-none-brightgreen)

工作区和分支会话一多，DSH 的侧栏就变成一条长长的列表。这个插件可以把工作区归进文件夹，把分支会话以树状显示在原会话下面，并让拖拽手感和 Claude 一样。它不替换任何界面：每一行、每个按钮、菜单和悬浮卡片都仍然是 DSH 自己的。

```
工作区                      🔍  📁+  ⚙  ＋
学校 ▾                                        ← 你的文件夹
   📂 数学
        微积分真题                     5h
        复数  ▾                        9h     ← 有分支
        ├ 复数 (fork)                  1d
        └ 复数 (fork 2)                2d
   📁 物理
机器人 ▸                            2         ← 已折叠的文件夹
📁 默认工作区
```

## 功能

**整理**
- 📁 **工作区文件夹。** 文件夹可以随意命名（学校、机器人、客户……），里面放多少个工作区都可以。文件夹可以折叠、重命名、排序和删除。删除文件夹只会解散分组，里面的内容不会丢失。
- 🌳 **分支树。** 分支出来的会话会显示在原会话下面，用连接线相连。点击 ▾ 可以把分支收起来。

**手感**
- ✋ **Claude 风格拖拽。** 拖动时项目会浮起成一个胶囊，列表变暗，其他行会让开一个虚线占位框，悬停的文件夹会高亮。松手在占位框上，项目就落在那里。
- 📜 **滚动标题。** 鼠标悬停在过长的标题上时，标题会来回滚动，方便读完整个标题。

**更多操作**（在每个会话的 **⋯** 菜单里）
- 📦 **导出为 ZIP。** 把会话连同子会话和附件保存到电脑上。
- ✨ **生成标题。** 由会话当前使用的模型阅读整段对话，生成一个简短标题。DSH 本身只会根据第一条消息命名一次。
- ⚙️ **自动标题**（可选）。在 **插件** 里的插件页面打开“每次回复后自动生成 AI 标题”，标题会随对话进展自动更新。

## 安装

打开 **PowerShell**，运行：

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add github:William20100221/dsh-beta-layout-folder-file
```

然后**重启 DeepSeek Harness**：从托盘图标退出，再重新打开。

## 创建第一个文件夹

1. 点击“工作区”标题栏里的 **文件夹加号** 按钮。
2. 输入名称，按 **回车**。
3. 把一个工作区拖到文件夹标题上。想移出来时，把它拖回到没有分组的工作区中间即可。

## 常见问题

**会修改我的会话或文件吗？**
不会。它只改变侧栏里工作区的分组和顺序，以及你要求时（或开启自动标题后）的会话标题。

**设置保存在哪里？**
文件夹保存在这台电脑的应用里。工作区顺序由 DSH 自己保存，所以 DSH 的其他界面（比如工作区选择器）也使用同样的顺序。自动标题开关保存在 `~/.dsh/dsh-beta-layout-folder-file.json`。

**“生成标题”提示没有可总结的内容？**
会话需要先有至少一问一答，插件才知道该调用哪个模型。

**怎么卸载？**
在 **插件** 里的插件页面点击 **卸载**，或运行：

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop remove dsh-beta-layout-folder-file
```

侧栏会立即恢复原样。

## 须知

- 文件夹和分支树显示在 DSH 默认的分组视图里。平铺列表和搜索结果保持 DSH 原样。
- 在 **工作区树** 视图下，只有顶层工作区可以放进文件夹。
- 文件夹总是排在未分组的工作区上方。
- 生成的标题会被保留，DSH 自己根据第一条消息生成的标题不会覆盖它。

## 开发者

技术细节见[英文文档的开发者部分](README.md#for-developers)。运行测试：

```sh
npm test
```

欢迎提交 Issue 和 Pull Request。

## 许可证

MIT
