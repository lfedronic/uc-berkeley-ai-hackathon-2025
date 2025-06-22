/* ──────────────────────────────────────────────────────────
   lib/agents/flexLayoutTools.ts
   – helpers invoked from LayoutChat (FlexLayout v1.7+)
─────────────────────────────────────────────────────────── */
import {
  Model,
  Actions,
  DockLocation,
  TabSetNode,
  Node,
  IJsonModel,
} from 'flexlayout-react';
import { useLayoutStore } from '@/lib/stores/layoutStore';

/* ------------------------------------------------------------------ */
/*  SMALL UTILS                                                        */
/* ------------------------------------------------------------------ */
const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? `tab-${crypto.randomUUID()}`
    : `tab-${Date.now()}`;

const bg = (t: string) =>
  (
    {
      lecture: 'bg-blue-100',
      quiz: 'bg-green-100',
      diagram: 'bg-purple-100',
      summary: 'bg-yellow-100',
    } as Record<string, string>
  )[t] ?? 'bg-gray-100';

/* walk JSON helper */
function walk<T>(model: Model, fn: (node: any, parent: any) => T | undefined) {
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

/* camel-case slug for labels */
const camel = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/ (.)/g, (_, c) => c.toUpperCase());

/* ------------------------------------------------------------------ */
/*  STORE COMMIT – keep label-map & raw JSON current                   */
/* ------------------------------------------------------------------ */
function commit(model: Model) {
  const labels: Record<string, string> = {};

  const addLabel = (key: string, id: string) => {
    // do not overwrite if the user already has a custom alias
    if (!labels[key]) labels[key] = id;
  };

  walk(model, (n, parent) => {
    if (n.type === 'tabset') {
      /* pane label (unchanged) */
      if (n.children?.[0]?.name)
        addLabel(`${camel(n.children[0].name)}Pane`, n.id);

      /* ▶ NEW ◀ — also add labels for every tab inside that pane */
      n.children?.forEach((tab: any) => {
        if (tab.type === 'tab' && tab.name) {
          addLabel(`${camel(tab.name)}Tab`, tab.id);
        }
      });
    }
  });

  labels.rootRow = model.getRoot().getId();
  useLayoutStore.getState().setLayoutJson(model.toJson() as IJsonModel, labels);
}

/* ------------------------------------------------------------------ */
/*  PUBLIC API (tools)                                                 */
/* ------------------------------------------------------------------ */
export interface FlexLayoutToolResult {
  success: boolean;
  error?: string;
  message?: string;
  /* optional data for chaining */
  tabId?: string;
  tabsetId?: string;
  newTabId?: string;
  newTabsetId?: string;
}

/* ────────── ADD TAB ────────── */
export function addTabToFlexLayout(
  model: Model,
  paneId: string,
  title: string,
  contentId: string,
  makeActive = false,
): FlexLayoutToolResult {
  const pane = model.getNodeById(paneId) as TabSetNode | null;
  if (!pane || pane.getType() !== 'tabset') {
    return { success: false, error: 'PANE_NOT_FOUND', message: `Pane ${paneId} not found` };
  }

  const tabId = uid();
  model.doAction(
    Actions.addNode(
      {
        type: 'tab',
        id: tabId,
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

  commit(model);
  return { success: true, message: `Added tab “${title}”`, tabId };
}

/* ────────── ACTIVATE TAB ────────── */
export function activateTabInFlexLayout(
  model: Model,
  _paneId: string, // kept for backward compatibility, no longer needed
  tabId: string,
): FlexLayoutToolResult {
  try {
    model.doAction(Actions.selectTab(tabId));
    commit(model);
    return { success: true, message: `Activated tab ${tabId}` };
  } catch (e) {
    return { success: false, error: 'EXECUTION_ERROR', message: (e as Error).message };
  }
}

/* ────────── CLOSE TAB ────────── */
export function closeTabInFlexLayout(model: Model, tabId: string): FlexLayoutToolResult {
  try {
    model.doAction(Actions.deleteTab(tabId));
    commit(model);
    return { success: true, message: `Closed tab ${tabId}` };
  } catch (e) {
    return { success: false, error: 'EXECUTION_ERROR', message: (e as Error).message };
  }
}

/* ────────── SPLIT PANE (row/column tolerant, returns IDs) ────────── */
export function splitPaneInFlexLayout(
  model: Model,
  target: string,
  orientation: 'row' | 'column',
  ratio = 0.67,
): FlexLayoutToolResult {
  /* 1 — resolve target node */
  let tgt = model.getNodeById(target) as Node | null;

  if (!tgt) {
    /* also allow the caller to pass the name of a tab */
    const parentId = walk<string | undefined>(model, (n, parent) => {
      if (n.type === 'tab' && n.name?.toLowerCase() === target.toLowerCase()) return parent?.id;
    });
    if (parentId) tgt = model.getNodeById(parentId) as Node | null;
  }
  if (!tgt) {
    return { success: false, error: 'TARGET_NOT_FOUND', message: `Can’t find “${target}”` };
  }

  /* 2 — ensure we have a tabset container to split */
  let containerId: string;
  if (tgt.getType() === 'tabset') {
    containerId = tgt.getId();
  } else {
    /* wrap non-tabset targets in a fresh tabset first */
    const tmpSet = `tabset-${uid()}`;
    const tmpTab = uid();
    model.doAction(
      Actions.addNode(
        {
          type: 'tabset',
          id: tmpSet,
          weight: 50,
          children: [
            {
              type: 'tab',
              id: tmpTab,
              name: 'Temp',
              component: 'content',
              config: { contentType: 'placeholder', bgColor: 'bg-gray-100' },
            },
          ],
        },
        tgt.getId(),
        DockLocation.CENTER,
        -1,
        false,
      ),
    );
    containerId = tmpSet;
  }

  /* 3 — add the actual split */
  const newTabsetId = `tabset-${uid()}`;
  const newTabId = uid();
  const dock = orientation === 'row' ? DockLocation.RIGHT : DockLocation.BOTTOM;

  model.doAction(
    Actions.addNode(
      {
        type: 'tabset',
        id: newTabsetId,
        weight: ratio * 100,
        children: [
          {
            type: 'tab',
            id: newTabId,
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

  commit(model);
  return {
    success: true,
    message: `Split pane ${containerId} (${orientation})`,
    newTabId,
    newTabsetId,
  };
}

/* ────────── MOVE TAB (unchanged) ────────── */
export function moveTabInFlexLayout(
  model: Model,
  tabId: string,
  toPaneId: string,
  position = -1,
): FlexLayoutToolResult {
  try {
    const target = model.getNodeById(toPaneId);
    if (!target || target.getType() !== 'tabset')
      return { success: false, error: 'TARGET_NOT_TABSET' };

    model.doAction(Actions.moveNode(tabId, toPaneId, DockLocation.CENTER, position));
    commit(model);
    return { success: true, message: `Moved tab ${tabId} → ${toPaneId}` };
  } catch (e) {
    return { success: false, error: 'EXECUTION_ERROR', message: (e as Error).message };
  }
}

/* ────────── ENV SNAPSHOT ────────── */
export function getEnvironmentFromFlexLayout(model: Model): FlexLayoutToolResult {
  return { success: true, message: JSON.stringify(model.toJson()) };
}

/* ────────── helper getters (for UI) ────────── */
export function getAvailablePaneIds(model: Model): string[] {
  const ids: string[] = [];
  walk(model, (n) => {
    if (n.type === 'tabset') ids.push(n.id);
  });
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
