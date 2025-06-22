import { tool } from 'ai';
import { z } from 'zod';
import { getCurrentFlexLayoutModel } from '@/app/learn/components/FlexLayoutContainer';
import {
  addTabToFlexLayout,
  activateTabInFlexLayout,
  closeTabInFlexLayout,
  splitPaneInFlexLayout,
  getEnvironmentFromFlexLayout,
  getAvailablePaneIds,
  getAvailableTabIds,
  FlexLayoutToolResult
} from './flexLayoutTools';

/**
 * AI SDK tool wrapper for FlexLayout management
 * Connects existing FlexLayout tools to Vercel AI SDK with Gemini 2.5 Flash
 */
export const layoutTool = tool({
  description: `Manage a dynamic split-screen UI layout for a multimodal AI tutor. 
    The layout supports tabs within panes, drag/drop interactions, and programmatic control.
    Available actions: addTab, activateTab, closeTab, split, getEnv.
    
    Current layout: 2x2 grid with lecture, quiz, diagram, and summary panes.
    Each pane can contain multiple tabs that users can switch between.`,
  
  parameters: z.object({
    action: z.enum(['addTab', 'activateTab', 'closeTab', 'split', 'getEnv']).describe('The layout action to perform'),
    
    // Parameters for addTab
    paneId: z.string().optional().describe('ID of the pane/tabset to add tab to (required for addTab, activateTab, split)'),
    title: z.string().optional().describe('Title for the new tab (required for addTab)'),
    contentId: z.enum(['lecture', 'quiz', 'diagram', 'summary', 'placeholder']).optional().describe('Content type for the new tab (required for addTab)'),
    makeActive: z.boolean().optional().default(true).describe('Whether to make the new tab active (for addTab)'),
    
    // Parameters for activateTab
    tabId: z.string().optional().describe('ID of the tab to activate or close (required for activateTab, closeTab)'),
    
    // Parameters for split
    orientation: z.enum(['row', 'column']).optional().describe('Split orientation: row (left/right) or column (top/bottom) (required for split)'),
    ratio: z.number().min(0.1).max(0.9).optional().default(0.5).describe('Split ratio between 0.1 and 0.9 (for split)'),
  }),
  
  execute: async ({ action, paneId, title, contentId, makeActive, tabId, orientation, ratio }) => {
    try {
      const model = getCurrentFlexLayoutModel();
      
      if (!model) {
        return {
          success: false,
          error: 'FlexLayout model not available. The layout system may not be initialized.',
          availablePanes: [],
          availableTabs: []
        };
      }

      let result: FlexLayoutToolResult;
      
      // Get current state for context
      const availablePanes = getAvailablePaneIds(model);
      const availableTabs = getAvailableTabIds(model);
      
      switch (action) {
        case 'addTab':
          if (!paneId || !title || !contentId) {
            return {
              success: false,
              error: 'Missing required parameters for addTab: paneId, title, contentId',
              availablePanes,
              availableTabs,
              hint: `Available panes: ${availablePanes.join(', ')}`
            };
          }
          
          result = addTabToFlexLayout(model, paneId, title, contentId, makeActive ?? true);
          break;
          
        case 'activateTab':
          if (!paneId || !tabId) {
            return {
              success: false,
              error: 'Missing required parameters for activateTab: paneId, tabId',
              availablePanes,
              availableTabs,
              hint: `Available tabs: ${availableTabs.map(t => `${t.name} (${t.id})`).join(', ')}`
            };
          }
          
          result = activateTabInFlexLayout(model, paneId, tabId);
          break;
          
        case 'closeTab':
          if (!tabId) {
            return {
              success: false,
              error: 'Missing required parameter for closeTab: tabId',
              availablePanes,
              availableTabs,
              hint: `Available tabs: ${availableTabs.map(t => `${t.name} (${t.id})`).join(', ')}`
            };
          }
          
          result = closeTabInFlexLayout(model, tabId);
          break;
          
        case 'split':
          if (!paneId || !orientation) {
            return {
              success: false,
              error: 'Missing required parameters for split: paneId, orientation',
              availablePanes,
              availableTabs,
              hint: `Available panes: ${availablePanes.join(', ')}, orientations: row, column`
            };
          }
          
          result = splitPaneInFlexLayout(model, paneId, orientation, ratio ?? 0.5);
          break;
          
        case 'getEnv':
          result = getEnvironmentFromFlexLayout(model);
          
          // Enhance environment result with current state
          if (result.success) {
            return {
              success: true,
              message: result.message,
              environment: {
                availablePanes,
                availableTabs,
                totalPanes: availablePanes.length,
                totalTabs: availableTabs.length,
                layoutStructure: 'Current layout has panes that can contain multiple tabs'
              }
            };
          }
          break;
          
        default:
          return {
            success: false,
            error: `Unknown action: ${action}`,
            availablePanes,
            availableTabs
          };
      }
      
      // Return enhanced result with current state
      return {
        success: result.success,
        message: result.message,
        error: result.error,
        availablePanes: getAvailablePaneIds(model), // Get updated state
        availableTabs: getAvailableTabIds(model),   // Get updated state
        action: action
      };
      
    } catch (error) {
      return {
        success: false,
        error: 'Unexpected error in layout tool execution',
        details: error instanceof Error ? error.message : 'Unknown error',
        action: action
      };
    }
  }
});

/**
 * Helper function to format layout state for AI context
 */
export function getLayoutContext(): string {
  const model = getCurrentFlexLayoutModel();
  
  if (!model) {
    return 'Layout system not available';
  }
  
  const panes = getAvailablePaneIds(model);
  const tabs = getAvailableTabIds(model);
  
  return `Current Layout State:
- Available Panes: ${panes.join(', ')}
- Available Tabs: ${tabs.map(t => `"${t.name}" (${t.id}) in ${t.paneId}`).join(', ')}
- Total Panes: ${panes.length}
- Total Tabs: ${tabs.length}

The layout supports adding new tabs, switching between tabs, closing tabs, and splitting panes.
Each pane can contain multiple tabs with different content types: lecture, quiz, diagram, summary, or placeholder.`;
}
