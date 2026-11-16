import { DSH_DROP_INDICATORS, SEL } from './dsh-dom.js'

// The plugin's stylesheet. Colours come from DSH's design tokens so light and dark themes both work;
// the `dshcl-` prefix is frozen (see constants.js). Injected once by overlay.js.
export const CSS = /* css */ `
/* ---- folders */
.dshcl-block{margin-top:4px}
.dshcl-folder{position:relative;display:flex;align-items:center;gap:6px;height:32px;padding:0 6px 0 12px;border-radius:var(--dsw-radius-md,10px);font-size:13px;font-weight:600;color:var(--dsw-alias-label-secondary);cursor:pointer;user-select:none;-webkit-user-select:none}
@media (hover:hover){.dshcl-folder:hover{background:var(--dsw-alias-interactive-bg-hover)}}
.dshcl-folder-icon{display:inline-flex;flex:none;font-size:14px;line-height:1}
.dshcl-folder-icon:empty{display:none}
.dshcl-folder-title{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dshcl-caret{display:inline-flex;flex:none;transform:rotate(90deg);transition:transform .15s}
.dshcl-block[data-collapsed] .dshcl-caret{transform:none}
.dshcl-spacer{flex:1}
.dshcl-count{font-size:12px;font-weight:400;color:var(--dsw-alias-label-secondary)}
.dshcl-block:not([data-collapsed]) .dshcl-count{display:none}
.dshcl-acts{display:none;align-items:center;gap:2px}
@media (hover:hover){
  .dshcl-folder:hover .dshcl-acts,.dshcl-folder:focus-within .dshcl-acts,.dshcl-block[data-menu] .dshcl-acts{display:inline-flex}
  .dshcl-folder:hover .dshcl-count,.dshcl-folder:focus-within .dshcl-count{display:none}
}
@media (hover:none){.dshcl-acts{display:inline-flex}.dshcl-count{display:none!important}}
.dshcl-btn{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:none;border-radius:var(--dsw-radius-sm,8px);background:none;color:var(--dsw-alias-label-secondary);cursor:pointer}
@media (hover:hover){.dshcl-btn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}}
.dshcl-hint{height:28px;display:flex;align-items:center;padding-left:24px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.dshcl-block[data-collapsed] .dshcl-hint,.dshcl-block:not([data-empty]) .dshcl-hint{display:none}
.dshcl-rename{flex:1;min-width:0;height:24px;padding:0 6px;border:1px solid var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;outline:none}
/* Folder members sit under their header: the row-padding token moves every row in the section (nested
   Workspace Tree children keep their own extra indent), and DSH's hover fill stays full width. */
${SEL.list}{--dshcl-row-pad:var(--dsh-sidebar-row-padding,12px)}
[data-dshcl-member]{--dsh-sidebar-row-padding:calc(var(--dshcl-row-pad) + 12px)}
[data-dshcl-hidden]{display:none!important}

/* ---- first-run hint */
.dshcl-onboard{display:flex;align-items:flex-start;gap:8px;margin:2px 4px 8px;padding:8px 10px;border-radius:var(--dsw-radius-md,10px);background:var(--dsw-alias-interactive-bg-hover);font-size:12px;line-height:17px;color:var(--dsw-alias-label-secondary)}
.dshcl-onboard button{flex:none;padding:2px 8px;border:none;border-radius:6px;background:none;color:var(--dsw-alias-link,var(--dsw-alias-state-business-primary));font:inherit;cursor:pointer}

/* ---- fork tree: children indent with a connector line; a caret on the source row folds them */
[data-dshcl-depth]{position:relative;margin-left:calc(var(--dshcl-depth) * 16px)}
.dshcl-tree-line{position:absolute;left:-10px;top:-3px;width:8px;height:calc(100% + 3px);border-left:1px solid var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));pointer-events:none}
.dshcl-tree-line::after{content:"";position:absolute;left:-1px;top:0;width:8px;height:calc(50% + 3px);border-left:1px solid var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));border-bottom:1px solid var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));border-bottom-left-radius:6px}
[data-dshcl-last] .dshcl-tree-line{border-left-color:transparent}
.dshcl-tree-toggle{display:inline-flex;align-items:center;gap:2px;flex:none;height:18px;min-width:18px;margin-left:2px;padding:0 3px;border:none;border-radius:4px;background:none;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:11px;cursor:pointer}
@media (hover:hover){.dshcl-tree-toggle:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}}
.dshcl-tree-toggle svg{transform:rotate(90deg);transition:transform .15s}
.dshcl-tree-toggle[aria-expanded="false"] svg{transform:none}
.dshcl-tree-toggle[aria-expanded="false"]::after{content:attr(data-count)}

/* ---- drag effects over DSH's native drag */
body.dshcl-dragging ${SEL.list} ${SEL.anyRow},body.dshcl-dragging .dshcl-folder{opacity:.45;transition:opacity .15s}
body.dshcl-dragging [data-dshcl-source]{height:0!important;min-height:0!important;padding-top:0!important;padding-bottom:0!important;margin-top:0!important;margin-bottom:0!important;border:0!important;opacity:0;overflow:hidden;transition:height .15s,opacity .15s}
body.dshcl-dragging .dshcl-block[data-over] .dshcl-folder{opacity:1;background:var(--dsw-alias-interactive-bg-hover);box-shadow:inset 0 0 0 1.5px var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary,#4d6bfe))}
body.dshcl-dragging :is(${DSH_DROP_INDICATORS.join(',')}){display:none!important}
.dshcl-slot{box-sizing:border-box;height:0;margin:0 4px;border:1.5px dashed var(--dsw-alias-label-tertiary);border-radius:10px;pointer-events:none;opacity:0;transition:height .15s,margin .15s,opacity .15s}
.dshcl-slot[data-open]{height:32px;margin:2px 4px;opacity:1}
.dshcl-ghost{position:fixed;left:-1000px;top:-1000px;z-index:-1;display:flex;align-items:center;max-width:240px;height:30px;padding:0 12px;border-radius:10px;background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#0f1115);font:14px var(--dsw-font-family,system-ui);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 6px 20px rgba(0,0,0,.14),0 0 0 1px rgba(0,0,0,.05)}
.dshcl-ghost[data-group]{font-size:13px;font-weight:600}

/* ---- keyboard focus */
.dshcl-folder:focus-visible,.dshcl-btn:focus-visible,.dshcl-tree-toggle:focus-visible,.dshcl-onboard button:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary,#4d6bfe));outline-offset:-2px}

/* ---- settings page */
.dshcl-settings{font-size:13px;color:var(--dsw-alias-label-primary)}
.dshcl-settings label{display:flex;align-items:center;gap:8px;cursor:pointer}
.dshcl-settings p{margin:6px 0 0 24px;font-size:12px;line-height:17px;color:var(--dsw-alias-label-secondary)}

@media (prefers-reduced-motion:reduce){
  .dshcl-caret,.dshcl-tree-toggle svg,.dshcl-slot,body.dshcl-dragging ${SEL.list} ${SEL.anyRow},body.dshcl-dragging .dshcl-folder,body.dshcl-dragging [data-dshcl-source]{transition:none}
}
`
