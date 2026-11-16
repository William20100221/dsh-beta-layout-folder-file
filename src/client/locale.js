// Dictionaries for DSH's locale service (`ctx.locale.register(NS, { en, zh })`).
// Add a language by adding an export here and registering it in index.js; DSH falls back to `en`.

export const en = {
  // folders
  newFolder: 'New folder',
  newFolderEllipsis: 'New folder…',
  dropIntoFolder: 'Drag workspaces here',
  rename: 'Rename',
  deleteFolder: 'Delete folder',
  moveToFolder: 'Move to folder',
  removeFromFolder: 'Remove from folder',
  collapseAll: 'Collapse all folders',
  expandAll: 'Expand all folders',
  addWorkspaceHere: 'Add a workspace to this folder',
  more: 'More',
  workspaces: 'workspaces',
  folderHeaderHint: 'Click to fold · Alt+click folds all · F2 renames · right-click for more',
  onboard: 'Group workspaces into folders: right-click a workspace and choose Move to folder, or use the folder button above.',
  gotIt: 'Got it',
  // notices
  undo: 'Undo',
  undoFailed: 'Could not undo',
  movedTo: 'Moved to',
  removedFromFolder: 'Removed from folder',
  folderDeleted: 'Folder deleted',
  // fork tree
  forks: 'forks',
  // session actions
  export: 'Export as ZIP',
  generateTitle: 'Generate title',
  generating: 'Generating title…',
  titled: 'Title updated',
  titleFailed: 'Could not generate a title',
  // settings
  autoTitle: 'Generate an AI title after every reply',
  autoTitleHint:
    'Off: DSH titles a session once, from its first message. Use "Generate title" in a session’s ⋯ menu to retitle it from the whole conversation. A title you typed yourself is never replaced.',
}

export const zh = {
  newFolder: '新建文件夹',
  newFolderEllipsis: '新建文件夹…',
  dropIntoFolder: '将工作区拖到这里',
  rename: '重命名',
  deleteFolder: '删除文件夹',
  moveToFolder: '移动到文件夹',
  removeFromFolder: '移出文件夹',
  collapseAll: '折叠所有文件夹',
  expandAll: '展开所有文件夹',
  addWorkspaceHere: '在此文件夹中添加工作区',
  more: '更多',
  workspaces: '个工作区',
  folderHeaderHint: '点击折叠 · Alt+点击折叠全部 · F2 重命名 · 右键查看更多',
  onboard: '把工作区归入文件夹：右键工作区并选择“移动到文件夹”，或点击上方的文件夹按钮。',
  gotIt: '知道了',
  undo: '撤销',
  undoFailed: '无法撤销',
  movedTo: '已移动到',
  removedFromFolder: '已移出文件夹',
  folderDeleted: '文件夹已删除',
  forks: '个分支',
  export: '导出为 ZIP',
  generateTitle: '生成标题',
  generating: '正在生成标题…',
  titled: '标题已更新',
  titleFailed: '无法生成标题',
  autoTitle: '每次回复后自动生成 AI 标题',
  autoTitleHint: '关闭时，DSH 只会根据第一条消息为会话命名一次。可在会话的 ⋯ 菜单中选择“生成标题”，根据整段对话重新命名。你自己输入的标题不会被替换。',
}
