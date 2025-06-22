/* ────────────────────────────────────────────────
   lib/agents/flexLayoutTools.ts
   – robust splitPane (row/column IDs accepted)
───────────────────────────────────────────────── */
import { Model, Actions, DockLocation, TabSetNode, RowNode, RowOrColumn, Node } from 'flexlayout-react';

export interface FlexLayoutToolResult {
  success: boolean;
  error?:   string;
  message?: string;
}

/* ---------- utility: walk the JSON tree ---------- */
function walk<T>(model: Model, fn: (node: any, parent: any) => T | undefined): T | undefined {
  const dfs = (n: any, parent: any): T | undefined => {
    const out = fn(n, parent);
    if (out !== undefined) return out;
    n.children?.forEach((c: any) => {
      const o = dfs(c, n);
      if (o !== undefined) return o;
    });
    return undefined;
  };
  return dfs(model.toJson().layout, null);
}

/* ---------- bg-colours for demo panes ---------- */
const bg = (t: string) =>
  ({ lecture: 'bg-blue-100', quiz: 'bg-green-100', diagram: 'bg-purple-100', summary: 'bg-yellow-100' }[
    t
  ] ?? 'bg-gray-100');

/* ------------------------------------------------------------------ */
/*  ADD TAB                                                            */
/* ------------------------------------------------------------------ */
export function addTabToFlexLayout(
  model: Model,
  paneId: string,
  title: string,
  contentId: string,
  makeActive = false,
): FlexLayoutToolResult {
  try {
    const pane = model.getNodeById(paneId) as TabSetNode | null;
    if (!pane || pane.getType() !== 'tabset') {
      return { success: false, error: 'PANE_NOT_FOUND', message: `Pane ${paneId} not found` };
    }

    const newTabId = `tab-${Date.now()}`;
    model.doAction(
      Actions.addNode(
        {
          type: 'tab',
          id:   newTabId,
          name: title,
          component: 'content',
          config: { contentType: contentId, bgColor: bg(contentId) },
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

/* ------------------------------------------------------------------ */
/*  ACTIVATE TAB                                                       */
/* ------------------------------------------------------------------ */
export function activateTabInFlexLayout(model: Model, _pid: string, tabId: string): FlexLayoutToolResult {
  try {
    model.doAction(Actions.selectTab(tabId));
    return { success: true, message: `Activated tab ${tabId}` };
  } catch (e) {
    return { success: false, error: 'EXECUTION_ERROR', message: (e as Error).message };
  }
}

/* ------------------------------------------------------------------ */
/*  CLOSE TAB                                                          */
/* ------------------------------------------------------------------ */
export function closeTabInFlexLayout(model: Model, tabId: string): FlexLayoutToolResult {
  try {
    model.doAction(Actions.deleteTab(tabId));
    return { success: true, message: `Closed tab ${tabId}` };
  } catch (e) {
    return { success: false, error: 'EXECUTION_ERROR', message: (e as Error).message };
  }
}

/* ------------------------------------------------------------------ */
/*  SPLIT PANE (now tolerant)                                          */
/* ------------------------------------------------------------------ */
export function splitPaneInFlexLayout(
  model: Model,
  target: string,
  orientation: 'row' | 'column',
  ratio = 0.67,
): FlexLayoutToolResult {
  try {
    /* 1. Resolve target node (ANY type now) */
    let tgtNode = model.getNodeById(target) as Node | null;

    /* Fallback: find tabset containing a tab with the given title */
    if (!tgtNode) {
      const parentId = walk<string | undefined>(model, (n, parent) => {
        if (n.type === 'tab' && n.name?.toLowerCase() === target.toLowerCase()) return parent?.id;
      });
      if (parentId) tgtNode = model.getNodeById(parentId) as Node | null;
    }

    if (!tgtNode) {
      return { success: false, error: 'TARGET_NOT_FOUND', message: `Can’t find pane “${target}”` };
    }

    const dock = orientation === 'row' ? DockLocation.RIGHT : DockLocation.BOTTOM;

    /* 2. Ensure we are docking under a TABSET */
    let containerId = tgtNode.getType() === 'tabset' ? tgtNode.getId() : undefined;

    if (!containerId) {
      /* create an empty tabset inside the row/column first */
      const newIntermediateId = `tabset-${Date.now()}`;
      model.doAction(
        Actions.addNode(
          {
            type: 'tabset',
            id:   newIntermediateId,
            weight: 50,
            children: [
              {
                type: 'tab',
                id:   `tab-${Date.now()}`,
                name: 'Temp',
                component: 'content',
                config: { contentType: 'placeholder', bgColor: 'bg-gray-100' },
              },
            ],
          },
          tgtNode.getId(),
          DockLocation.CENTER,
          -1,
          false,
        ),
      );
      containerId = newIntermediateId;
    }

    /* 3. Dock the new split next to containerId */
    const newTabsetId = `tabset-${Date.now()}`;
    const newTabId    = `tab-${Date.now()}`;

    model.doAction(
      Actions.addNode(
        {
          type: 'tabset',
          id:   newTabsetId,
          weight: ratio * 100,
          children: [
            {
              type: 'tab',
              id:   newTabId,
              name: 'New Tab',
              component: 'content',
              config: { contentType: 'placeholder', bgColor: 'bg-gray-100' },
            },
          ],
        },
        containerId,
        dock,
        0,
        false,
      ),
    );

    return { success: true, message: `Split pane ${containerId} (${orientation})` };
  } catch (e) {
    return { success: false, error: 'EXECUTION_ERROR', message: (e as Error).message };
  }
}

/* ------------------------------------------------------------------ */
/*  ENV SNAPSHOT                                                       */
/* ------------------------------------------------------------------ */
export function getEnvironmentFromFlexLayout(model: Model): FlexLayoutToolResult {
  try {
    return { success: true, message: JSON.stringify(model.toJson()) };
  } catch (e) {
    return { success: false, error: 'EXECUTION_ERROR', message: (e as Error).message };
  }
}

/* ------------------------------------------------------------------ */
/*  Helper utilities for UI                                            */
/* ------------------------------------------------------------------ */
export function getAvailablePaneIds(model: Model): string[] {
  const ids: string[] = [];
  walk(model, (n) => { if (n.type === 'tabset') ids.push(n.id); });
  return ids;
}

export function getAvailableTabIds(model: Model) {
  const out: Array<{ id: string; name: string; paneId: string }> = [];
  walk(model, (n, parent) => {
    if (n.type === 'tab' && parent?.type === 'tabset') {
      out.push({ id: n.id, name: n.name, paneId: parent.id });
    }
  });
  return out;
}
