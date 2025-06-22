import { tool } from 'ai';
import { z } from 'zod';

/**
 * Layout tool for AI SDK - NO execute function
 * Tool calls are forwarded to client for execution
 */
export const layoutTool = tool({
  description: `Manage a dynamic split-screen UI layout for a multimodal AI tutor. 
    Control tabs within panes, split panes, and manage the layout structure.
    
    Available actions:
    - addTab: Add a new tab to an existing pane
    - activateTab: Switch to a specific tab in a pane  
    - closeTab: Close a tab (can close last tab to remove pane)
    - split: Split a pane horizontally or vertically
    - getEnv: Get current layout information`,
  
  parameters: z.object({
    action: z.enum(['addTab', 'activateTab', 'closeTab', 'split', 'getEnv'])
      .describe('The action to perform on the layout'),
    
    // Make all fields required but allow empty strings for unused fields
    paneId: z.string()
      .describe('ID of the pane/tabset. Required for: addTab, activateTab, split. Use empty string "" for other actions.'),
    title: z.string()
      .describe('Title for the new tab. Required for: addTab. Use empty string "" for other actions.'),
    contentId: z.enum(['lecture', 'quiz', 'diagram', 'summary', 'placeholder', ''])
      .describe('Content type for the new tab. Required for: addTab (use "quiz" for homework, "lecture" for presentations, "diagram" for charts, "summary" for notes). Use empty string "" for other actions.'),
    makeActive: z.boolean()
      .describe('Whether to make the new tab active. Used for: addTab (defaults to true). Use false for other actions.'),
    tabId: z.string()
      .describe('ID of the tab. Required for: activateTab, closeTab. Use empty string "" for other actions.'),
    orientation: z.enum(['row', 'column', ''])
      .describe('Split orientation: "row" for left/right, "column" for top/bottom. Required for: split. Use empty string "" for other actions.'),
    ratio: z.number().min(0).max(1)
      .describe('Split ratio between 0 and 1. Used for: split (defaults to 0.5). Use 0.5 for other actions.'),
  }),
  
  // NO execute function - tool calls forwarded to client
});

/**
 * Helper function to format layout context for AI using semantic names
 */
export function formatLayoutContext(layoutState: any): string {
  if (!layoutState) {
    return 'Layout system not available';
  }
  
  const { availablePanes, availableTabs } = layoutState;
  
  if (!availableTabs || !availablePanes) {
    return 'Layout system not properly initialized';
  }
  
  // Group tabs by pane
  const paneToTabs: Record<string, any[]> = {};
  availableTabs.forEach((tab: any) => {
    if (!paneToTabs[tab.paneId]) {
      paneToTabs[tab.paneId] = [];
    }
    paneToTabs[tab.paneId].push(tab);
  });
  
  // Create semantic names for panes and tabs
  const semanticPanes: string[] = [];
  const semanticTabs: string[] = [];
  
  availablePanes.forEach((paneId: string) => {
    const tabs = paneToTabs[paneId] || [];
    const primaryTab = tabs[0];
    
    if (primaryTab) {
      const contentType = primaryTab.name.toLowerCase();
      let semanticPaneName = '';
      
      if (contentType.includes('lecture')) {
        semanticPaneName = 'lecture-pane';
      } else if (contentType.includes('quiz')) {
        semanticPaneName = 'quiz-pane';
      } else if (contentType.includes('diagram')) {
        semanticPaneName = 'diagram-pane';
      } else if (contentType.includes('summary')) {
        semanticPaneName = 'summary-pane';
      } else {
        semanticPaneName = `${contentType}-pane`;
      }
      
      semanticPanes.push(semanticPaneName);
      
      // Add semantic tab names
      tabs.forEach(tab => {
        const tabName = tab.name.toLowerCase().replace(/\s+/g, '-');
        semanticTabs.push(`${tabName}-tab`);
      });
    }
  });
  
  return `Current Layout:
Available Panes: ${semanticPanes.join(', ')}
Available Tabs: ${semanticTabs.join(', ')}

Examples:
- To add a tab: "Add a homework tab to quiz-pane"
- To close a tab: "Close diagram-tab"
- To split a pane: "Split lecture-pane horizontally"
- To switch tabs: "Activate summary-tab"

Use semantic names like "lecture-pane", "quiz-pane", "diagram-tab", "summary-tab" etc.`;
}
