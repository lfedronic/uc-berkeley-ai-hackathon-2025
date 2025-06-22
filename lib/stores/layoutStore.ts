import { create } from 'zustand';
import { tool } from 'ai';
import { z } from 'zod';
import type { IJsonModel } from 'flexlayout-react';

/* ------------------------------------------------------------------ */
/* 🧩  Helpers                                                         */
/* ------------------------------------------------------------------ */

const deepClone = <T>(x: T): T => structuredClone(x);

/** Find any node (row/column/tabset/tab) by id */
function findNode(node: any, id: string): any | null {
  if (!node) return null;
  if (node.id === id) return node;
  if (Array.isArray(node.children)) {
    for (const ch of node.children) {
      const f = findNode(ch, id);
      if (f) return f;
    }
  }
  return null;
}

/** If the node isn’t a tabset, return its first-tabset child (or null). */
function firstTabset(node: any | null): any | null {
  if (!node) return null;
  if (node.type === 'tabset') return node;
  return Array.isArray(node.children)
    ? node.children.find((c: any) => c.type === 'tabset') ?? null
    : null;
}

/** Build the simple label-map (F3). */
export function buildLabelMap(layout: any): Record<string, string> {
  const map: Record<string, string> = {};
  const camel = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/ (.)/g, (_, c) => c.toUpperCase());

  (function walk(n: any) {
    if (n.type === 'tabset' && n.children?.[0]?.name) {
      map[`${camel(n.children[0].name)}Pane`] = n.id;
    }
    n.children?.forEach?.(walk);
  })(layout);

  map.rootRow = layout.id;
  return map;
}

/* ------------------------------------------------------------------ */
/* 🗄️  Store definition                                                */
/* ------------------------------------------------------------------ */

interface LayoutState {
  layoutJson: IJsonModel | null;
  labels: Record<string, string>;
  env: any;
  /* mutations */
  setLayoutJson: (json: IJsonModel, labels: Record<string, string>) => void;
  updateEnv: (env: any) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  layoutJson: null,
  labels: {},
  env: null,
  setLayoutJson: (layoutJson, labels) => set({ layoutJson, labels }),
  updateEnv: (env) => set({ env })
}));

/* ------------------------------------------------------------------ */
/* 🔧  Layout tool with F1 & F3                                        */
/* ------------------------------------------------------------------ */

export const layoutTool = tool({
  description: 'FlexLayout client-side layout actions',
  parameters: z.object({
    verb: z.enum(['addTab', 'activateTab', 'closeTab', 'splitPane', 'getEnv']),
    /* addTab */
    paneId: z.string().optional(),
    title: z.string().optional(),
    contentId: z.string().optional(),
    makeActive: z.boolean().optional(),
    /* splitPane */
    targetId: z.string().optional(),
    orientation: z.enum(['row', 'column']).optional(),
    ratio: z.number().min(0.1).max(0.9).optional()
  }),
  execute: async ({ verb, ...p }) => {
    const store = useLayoutStore.getState();
    const root = store.layoutJson?.layout;
    if (!root) return { success: false, error: 'NO_LAYOUT' };

    /* -------------------------------------------------------------- */
    /*  F1 – smarter addTab                                           */
    /* -------------------------------------------------------------- */
    if (verb === 'addTab') {
      const { paneId, title, contentId, makeActive = false } = p;
      if (!paneId || !title || !contentId)
        return { success: false, error: 'MISSING_PARAMS' };

      const draft = deepClone(root);
      let pane: any = findNode(draft, paneId);
      pane = firstTabset(pane);
      if (!pane) return { success: false, error: 'PANE_NOT_FOUND' };

      // de-dup by title
      const dup = pane.children.find((t: any) => t.name === title);
      if (dup) {
        pane.activeTabId = dup.id;
        useLayoutStore.getState().setLayoutJson(
          { ...store.layoutJson, layout: draft },
          buildLabelMap(draft) //  F3 refresh labels
        );
        return { success: true, message: `Activated existing tab “${title}”` };
      }

      const id = `tab-${Date.now()}`;
      const newTab = {
        type: 'tab',
        id,
        name: title,
        component: 'content',
        config: { contentType: contentId }
      };
      pane.children.push(newTab);
      if (makeActive) pane.activeTabId = id;

      useLayoutStore.getState().setLayoutJson(
        { ...store.layoutJson, layout: draft },
        buildLabelMap(draft) //  F3 refresh labels
      );
      return { success: true, message: `Added tab “${title}”` };
    }

    /* -------------------------------------------------------------- */
    /*  Simple passthroughs / placeholders for other verbs            */
    /* -------------------------------------------------------------- */
    if (verb === 'getEnv') {
      return { success: true, env: store.env, labels: store.labels };
    }

    return { success: false, error: 'NOT_IMPLEMENTED' };
  }
});
