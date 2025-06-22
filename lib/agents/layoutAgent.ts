import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { create } from 'zustand';
import mitt from 'mitt';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

// ============================================================================
// Data Models (as per spec)
// ============================================================================

export interface LayoutNode {
  id: string;
  type: 'row' | 'column' | 'tabset';
  weight?: number;
  children?: LayoutNode[];
  tabs?: Tab[];
  activeTabId?: string;
}

export interface Tab {
  id: string;
  title: string;
  contentId: string;
  config?: Record<string, unknown>;
}

export interface EnvironmentSnapshot {
  viewport: {
    w: number;
    h: number;
    dpr: number;
  };
  panes: Array<{
    id: string;
    box: { w: number; h: number };
    widget: string;
    minW: number;
    minH: number;
  }>;
}

export interface LayoutState {
  layout: LayoutNode;
  env: EnvironmentSnapshot;
  history: {
    past: LayoutNode[];
    present: LayoutNode;
    future: LayoutNode[];
  };
}

// ============================================================================
// Event Bus for Cross-Pane Communication
// ============================================================================

type Events = {
  layoutChanged: LayoutNode;
  slideChanged: { slideIdx: number; fromPane: string };
  paneResized: { paneId: string; box: { w: number; h: number } };
};

export const paneBus = mitt<Events>();

// ============================================================================
// Zustand Store
// ============================================================================

export const useLayoutStore = create<LayoutState & {
  updateLayout: (layout: LayoutNode) => void;
  updateEnv: (env: EnvironmentSnapshot) => void;
  undo: () => void;
  redo: () => void;
}>((set, get) => ({
  layout: {
    id: 'root',
    type: 'row',
    weight: 100,
    children: [
      {
        id: 'left-column',
        type: 'column',
        weight: 50,
        children: [
          {
            id: 'tabset-1',
            type: 'tabset',
            weight: 50,
            tabs: [
              {
                id: 'tab-lecture',
                title: 'Lecture Notes',
                contentId: 'lecture',
                config: { contentType: 'lecture', bgColor: 'bg-blue-100' }
              }
            ],
            activeTabId: 'tab-lecture'
          },
          {
            id: 'tabset-2',
            type: 'tabset',
            weight: 50,
            tabs: [
              {
                id: 'tab-quiz',
                title: 'Quiz',
                contentId: 'quiz',
                config: { contentType: 'quiz', bgColor: 'bg-green-100' }
              }
            ],
            activeTabId: 'tab-quiz'
          }
        ]
      },
      {
        id: 'right-column',
        type: 'column',
        weight: 50,
        children: [
          {
            id: 'tabset-3',
            type: 'tabset',
            weight: 50,
            tabs: [
              {
                id: 'tab-diagram',
                title: 'Diagram',
                contentId: 'diagram',
                config: { contentType: 'diagram', bgColor: 'bg-purple-100' }
              }
            ],
            activeTabId: 'tab-diagram'
          },
          {
            id: 'tabset-4',
            type: 'tabset',
            weight: 50,
            tabs: [
              {
                id: 'tab-summary',
                title: 'Summary',
                contentId: 'summary',
                config: { contentType: 'summary', bgColor: 'bg-yellow-100' }
              }
            ],
            activeTabId: 'tab-summary'
          }
        ]
      }
    ]
  },
  env: {
    viewport: { w: 1440, h: 900, dpr: 2 },
    panes: []
  },
  history: {
    past: [],
    present: {
      id: 'root',
      type: 'row',
      weight: 100,
      children: []
    },
    future: []
  },

  updateLayout: (layout: LayoutNode) => {
    set((state) => ({
      history: {
        past: [...state.history.past, state.history.present],
        present: layout,
        future: []
      },
      layout
    }));
    paneBus.emit('layoutChanged', layout);
  },

  updateEnv: (env: EnvironmentSnapshot) => {
    set({ env });
  },

  undo: () => {
    const { history } = get();
    if (history.past.length === 0) return;
    
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);
    
    set({
      layout: previous,
      history: {
        past: newPast,
        present: previous,
        future: [history.present, ...history.future]
      }
    });
  },

  redo: () => {
    const { history } = get();
    if (history.future.length === 0) return;
    
    const next = history.future[0];
    const newFuture = history.future.slice(1);
    
    set({
      layout: next,
      history: {
        past: [...history.past, history.present],
        present: next,
        future: newFuture
      }
    });
  }
}));

// ============================================================================
// Layout Validation & Guards
// ============================================================================

function getDepth(node: LayoutNode, currentDepth = 0): number {
  if (node.type === 'tabset') return currentDepth;
  
  if (node.children) {
    return Math.max(...node.children.map(child => getDepth(child, currentDepth + 1)));
  }
  
  return currentDepth;
}

function validateDepthLimit(layout: LayoutNode): boolean {
  return getDepth(layout) <= 2;
}

function findNodeById(layout: LayoutNode, id: string): LayoutNode | null {
  if (layout.id === id) return layout;
  
  if (layout.children) {
    for (const child of layout.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  
  return null;
}

// ============================================================================
// Layout Tool Verbs (as per spec)
// ============================================================================

export const layoutTool = tool({
  description: 'Manage the FlexLayout-based split-screen UI with tabs',
  parameters: z.object({
    verb: z.enum([
      'split', 'resize', 'remove', 'assign', 'addTab', 
      'activateTab', 'closeTab', 'moveTab', 'setLayout', 'getEnv'
    ]),
    targetId: z.string().optional(),
    orientation: z.enum(['row', 'column']).optional(),
    ratio: z.number().min(0.1).max(0.9).optional(),
    paneId: z.string().optional(),
    contentId: z.string().optional(),
    tabId: z.string().optional(),
    title: z.string().optional(),
    makeActive: z.boolean().optional(),
    fromPane: z.string().optional(),
    toPane: z.string().optional(),
    position: z.number().optional(),
    layout: z.any().optional()
  }),
  execute: async ({ verb, ...params }) => {
    const store = useLayoutStore.getState();
    
    try {
      switch (verb) {
        case 'split': {
          const { targetId, orientation, ratio = 0.5 } = params;
          if (!targetId || !orientation) {
            return { error: 'MISSING_PARAMS', message: 'targetId and orientation required' };
          }
          
          const currentLayout = store.layout;
          const targetNode = findNodeById(currentLayout, targetId);
          
          if (!targetNode) {
            return { error: 'NODE_NOT_FOUND', message: `Node ${targetId} not found` };
          }
          
          // Create new layout with split
          const newLayout = JSON.parse(JSON.stringify(currentLayout));
          const newTargetNode = findNodeById(newLayout, targetId);
          
          if (newTargetNode && newTargetNode.type === 'tabset') {
            // Convert tabset to split node
            const newTabset = {
              id: `${targetId}-new`,
              type: 'tabset' as const,
              weight: 1 - ratio,
              tabs: [{
                id: `tab-${Date.now()}`,
                title: 'New Tab',
                contentId: 'placeholder',
                config: { contentType: 'placeholder', bgColor: 'bg-gray-100' }
              }],
              activeTabId: `tab-${Date.now()}`
            };
            
            newTargetNode.type = orientation;
            newTargetNode.children = [
              { ...newTargetNode, id: `${targetId}-original`, weight: ratio },
              newTabset
            ];
            delete newTargetNode.tabs;
            delete newTargetNode.activeTabId;
          }
          
          // Validate depth limit
          if (!validateDepthLimit(newLayout)) {
            return { error: 'DEPTH_LIMIT', message: 'Maximum depth of 2 exceeded' };
          }
          
          store.updateLayout(newLayout);
          return { success: true, layout: newLayout };
        }
        
        case 'addTab': {
          const { paneId, tabId, title, contentId, makeActive = false } = params;
          if (!paneId || !title || !contentId) {
            return { error: 'MISSING_PARAMS', message: 'paneId, title, and contentId required' };
          }
          
          const currentLayout = store.layout;
          const targetNode = findNodeById(currentLayout, paneId);
          
          if (!targetNode || targetNode.type !== 'tabset') {
            return { error: 'INVALID_TARGET', message: 'Target must be a tabset' };
          }
          
          const newLayout = JSON.parse(JSON.stringify(currentLayout));
          const newTargetNode = findNodeById(newLayout, paneId);
          
          if (newTargetNode && newTargetNode.tabs) {
            const newTabId = tabId || `tab-${Date.now()}`;
            const newTab = {
              id: newTabId,
              title,
              contentId,
              config: { contentType: contentId, bgColor: 'bg-gray-100' }
            };
            
            newTargetNode.tabs.push(newTab);
            if (makeActive) {
              newTargetNode.activeTabId = newTabId;
            }
          }
          
          store.updateLayout(newLayout);
          return { success: true, layout: newLayout };
        }
        
        case 'activateTab': {
          const { paneId, tabId } = params;
          if (!paneId || !tabId) {
            return { error: 'MISSING_PARAMS', message: 'paneId and tabId required' };
          }
          
          const currentLayout = store.layout;
          const targetNode = findNodeById(currentLayout, paneId);
          
          if (!targetNode || targetNode.type !== 'tabset') {
            return { error: 'INVALID_TARGET', message: 'Target must be a tabset' };
          }
          
          const newLayout = JSON.parse(JSON.stringify(currentLayout));
          const newTargetNode = findNodeById(newLayout, paneId);
          
          if (newTargetNode && newTargetNode.tabs) {
            const tabExists = newTargetNode.tabs.some(tab => tab.id === tabId);
            if (!tabExists) {
              return { error: 'TAB_NOT_FOUND', message: `Tab ${tabId} not found in pane ${paneId}` };
            }
            
            newTargetNode.activeTabId = tabId;
          }
          
          store.updateLayout(newLayout);
          return { success: true, layout: newLayout };
        }
        
        case 'closeTab': {
          const { paneId, tabId } = params;
          if (!paneId || !tabId) {
            return { error: 'MISSING_PARAMS', message: 'paneId and tabId required' };
          }
          
          const currentLayout = store.layout;
          const targetNode = findNodeById(currentLayout, paneId);
          
          if (!targetNode || targetNode.type !== 'tabset') {
            return { error: 'INVALID_TARGET', message: 'Target must be a tabset' };
          }
          
          const newLayout = JSON.parse(JSON.stringify(currentLayout));
          const newTargetNode = findNodeById(newLayout, paneId);
          
          if (newTargetNode && newTargetNode.tabs) {
            const tabIndex = newTargetNode.tabs.findIndex(tab => tab.id === tabId);
            if (tabIndex === -1) {
              return { error: 'TAB_NOT_FOUND', message: `Tab ${tabId} not found in pane ${paneId}` };
            }
            
            // Remove the tab
            newTargetNode.tabs.splice(tabIndex, 1);
            
            // If this was the active tab, activate another one
            if (newTargetNode.activeTabId === tabId && newTargetNode.tabs.length > 0) {
              newTargetNode.activeTabId = newTargetNode.tabs[0].id;
            }
            
            // If no tabs left, this could trigger pane cleanup (future enhancement)
            if (newTargetNode.tabs.length === 0) {
              return { error: 'EMPTY_PANE', message: 'Cannot close last tab in pane' };
            }
          }
          
          store.updateLayout(newLayout);
          return { success: true, layout: newLayout };
        }
        
        case 'resize': {
          const { paneId, ratio } = params;
          if (!paneId || ratio === undefined) {
            return { error: 'MISSING_PARAMS', message: 'paneId and ratio required' };
          }
          
          if (ratio < 0.1 || ratio > 0.9) {
            return { error: 'INVALID_RATIO', message: 'Ratio must be between 0.1 and 0.9' };
          }
          
          const currentLayout = store.layout;
          const targetNode = findNodeById(currentLayout, paneId);
          
          if (!targetNode) {
            return { error: 'NODE_NOT_FOUND', message: `Node ${paneId} not found` };
          }
          
          const newLayout = JSON.parse(JSON.stringify(currentLayout));
          const newTargetNode = findNodeById(newLayout, paneId);
          
          if (newTargetNode) {
            newTargetNode.weight = ratio;
          }
          
          store.updateLayout(newLayout);
          return { success: true, layout: newLayout };
        }
        
        case 'getEnv': {
          return { success: true, env: store.env };
        }
        
        default:
          return { error: 'NOT_IMPLEMENTED', message: `Verb ${verb} not yet implemented` };
      }
    } catch (error) {
      return { error: 'EXECUTION_ERROR', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
});

// ============================================================================
// Main Layout Agent Function
// ============================================================================

export interface LayoutRequest {
  instruction: string;
  context?: {
    currentLayout?: LayoutNode;
    env?: EnvironmentSnapshot;
  };
}

export async function executeLayoutOperation(request: LayoutRequest): Promise<string> {
  const { instruction, context } = request;
  const store = useLayoutStore.getState();
  
  const systemPrompt = `You are a layout management agent for a multimodal AI tutor interface.

CURRENT LAYOUT CONTEXT:
${JSON.stringify(context?.currentLayout || store.layout, null, 2)}

ENVIRONMENT:
${JSON.stringify(context?.env || store.env, null, 2)}

RULES:
1. Maximum depth of 2 splits (max 4 visual regions)
2. Each region can have multiple tabs
3. Always validate size constraints
4. Preserve user's work when possible

AVAILABLE VERBS:
- split: Create new pane by splitting existing one
- resize: Adjust pane proportions  
- remove: Remove a pane
- assign: Change tab content
- addTab: Add new tab to pane
- activateTab: Switch active tab
- closeTab: Close a tab
- moveTab: Move tab between panes
- getEnv: Get current environment snapshot

Execute the user's layout instruction using the appropriate tools.`;

  try {
    const result = await generateText({
      model: google('gemini-1.5-flash'),
      system: systemPrompt,
      prompt: instruction,
      tools: { layout: layoutTool },
      maxSteps: 5,
      temperature: 0.3,
    });

    return result.text;
  } catch (error) {
    console.error('Error executing layout operation:', error);
    throw new Error('Failed to execute layout operation');
  }
}
