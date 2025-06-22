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
      .describe('The layout action to perform'),
    
    // Parameters for addTab
    paneId: z.string().optional()
      .describe('ID of the pane/tabset (required for addTab, activateTab, split)'),
    title: z.string().optional()
      .describe('Title for the new tab (required for addTab)'),
    contentId: z.enum(['lecture', 'quiz', 'diagram', 'summary', 'placeholder']).optional()
      .describe('Content type for the new tab (required for addTab)'),
    makeActive: z.boolean().optional().default(true)
      .describe('Whether to make the new tab active (for addTab)'),
    
    // Parameters for activateTab and closeTab
    tabId: z.string().optional()
      .describe('ID of the tab to activate or close (required for activateTab, closeTab)'),
    
    // Parameters for split
    orientation: z.enum(['row', 'column']).optional()
      .describe('Split orientation: row (left/right) or column (top/bottom) (required for split)'),
    ratio: z.number().min(0.1).max(0.9).optional().default(0.5)
      .describe('Split ratio between 0.1 and 0.9 (for split)'),
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
