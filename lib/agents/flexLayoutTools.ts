/* ────────────────────────────────────────────────
   lib/agents/flexLayoutTools.ts
───────────────────────────────────────────────── */
import { Model, Actions, DockLocation } from 'flexlayout-react';

export interface FlexLayoutToolResult {
  success: boolean;
  error?:   string;
  message?: string;
  /* no more raw Model reference — it isn’t clone-able */
}

/* helper */
function getBgColorForContent(type: string) {
  return {
    lecture: 'bg-blue-100',
    quiz:    'bg-green-100',
    diagram: 'bg-purple-100',
    summary: 'bg-yellow-100',
  }[type] ?? 'bg-gray-100';
}

/* ------------------------------------------------------------------ */
export function addTabToFlexLayout(
  model: Model,
  paneId: string,
  title: string,
  contentId: string,
  makeActive = false,
): FlexLayoutToolResult {
  try {
    const pane = model.getNodeById(paneId);
    if (!pane || pane.getType() !== 'tabset') {
      return { success: false, error: 'PANE_NOT_FOUND', message: `Pane ${paneId} not found` };
    }

    const newTabId = `tab-${Date.now()}`;
    model.doAction(
      Actions.addNode(
        {
          type: 'tab',
          id: newTabId,
          name: title,
          component: 'content',
          config: { contentType: contentId, bgColor: getBgColorForContent(contentId) },
        },
        paneId,
        DockLocation.CENTER,
        makeActive ? 0 : -1,
        makeActive,
      ),
    );

    return { success: true, message: `Added tab “${title}” to pane ${paneId}` };
  } catch (e) {
    return { success: false, error: 'EXECUTION_ERROR', message: (e as Error).message };
  }
}

export function activateTabInFlexLayout(
  model: Model,
  _paneId: string,
  tabId: string,
): FlexLayoutToolResult {
  try {
    model.doAction(Actions.selectTab(tabId));
    return { success: true, message: `Activated tab ${tabId}` };
  } catch (e) {
    return { success: false, error: 'EXECUTION_ERROR', message: (e as Error).message };
  }
}

export function closeTabInFlexLayout(model: Model, tabId: string): FlexLayoutToolResult {
  try {
    model.doAction(Actions.deleteTab(tabId));
    return { success: true, message: `Closed tab ${tabId}` };
  } catch (e) {
    return { success: false, error: 'EXECUTION_ERROR', message: (e as Error).message };
  }
}

export function splitPaneInFlexLayout(
  model: Model,
  targetId: string,
  orientation: 'row' | 'column',
  ratio = 0.5,
): FlexLayoutToolResult {
  try {
    const dock        = orientation === 'row' ? DockLocation.RIGHT : DockLocation.BOTTOM;
    const newTabsetId = `tabset-${Date.now()}`;
    const newTabId    = `tab-${Date.now()}`;

    model.doAction(
      Actions.addNode(
        {
          type: 'tabset',
          id:   newTabsetId,
          children: [{
            type: 'tab',
            id:   newTabId,
            name: 'New Tab',
            component: 'content',
            config: { contentType: 'placeholder', bgColor: 'bg-gray-100' },
          }],
          weight: ratio * 100,
        },
        targetId,
        dock,
        0,
        false,
      ),
    );

    return { success: true, message: `Split pane ${targetId} (${orientation})` };
  } catch (e) {
    return { success: false, error: 'EXECUTION_ERROR', message: (e as Error).message };
  }
}

export function getEnvironmentFromFlexLayout(model: Model): FlexLayoutToolResult {
  try {
    return { success: true, message: JSON.stringify(model.toJson()) };
  } catch (e) {
    return { success: false, error: 'EXECUTION_ERROR', message: (e as Error).message };
  }
}

/* helpers for LayoutControls UI */
export function getAvailablePaneIds(model: Model): string[] {
  const ids: string[] = [];
  const walk = (n: any) => {
    if (n.type === 'tabset') ids.push(n.id);
    n.children?.forEach(walk);
  };
  walk(model.toJson().layout);
  return ids;
}

export function getAvailableTabIds(model: Model) {
  const out: Array<{ id: string; name: string; paneId: string }> = [];
  const walk = (n: any) => {
    if (n.type === 'tabset') {
      n.children?.forEach((t: any) => out.push({ id: t.id, name: t.name, paneId: n.id }));
    }
    n.children?.forEach(walk);
  };
  walk(model.toJson().layout);
  return out;
}
