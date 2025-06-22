/* ────────────────────────────────────────────────
   lib/agents/flexLayoutClientTools.ts
───────────────────────────────────────────────── */
import { tool } from 'ai';
import { z } from 'zod';

/** Tools forwarded to the client (no execute functions) */
export const addTabTool = tool({
  description: 'Add a new tab to a pane',
  parameters: z.object({
    paneId:     z.string(),
    title:      z.string(),
    contentId:  z.string(),
    makeActive: z.boolean().optional(),
  }),
});

export const activateTabTool = tool({
  description: 'Activate a tab',
  parameters: z.object({ paneId: z.string(), tabId: z.string() }),
});

export const closeTabTool = tool({
  description: 'Close a tab',
  parameters: z.object({ tabId: z.string() }),
});

export const splitPaneTool = tool({
  description: 'Split a pane',
  parameters: z.object({
    targetId:    z.string(),
    orientation: z.enum(['row', 'column']),
    ratio:       z.number().optional(),
  }),
});

export const getEnvTool = tool({
  description: 'Get current FlexLayout environment',
  parameters: z.object({}),
});
