import { tool } from 'ai';
import { z } from 'zod';

/**
 * Server-safe AI SDK tool for FlexLayout management
 * Works with serialized layout state instead of live React components
 */

interface LayoutState {
  availablePanes: string[];
  availableTabs: Array<{ id: string; name: string; paneId: string }>;
  totalPanes: number;
  totalTabs: number;
}

interface LayoutCommand {
  action: 'addTab' | 'activateTab' | 'closeTab' | 'split' | 'getEnv';
  paneId?: string;
  title?: string;
  contentId?: string;
  makeActive?: boolean;
  tabId?: string;
  orientation?: 'row' | 'column';
  ratio?: number;
}

// Create a function that returns the tool with the current layout state
export function createLayoutTool(layoutState: LayoutState) {
  return tool({
    description: `Manage a dynamic split-screen UI layout for a multimodal AI tutor. 
      The layout supports tabs within panes, drag/drop interactions, and programmatic control.
      Available actions: addTab, activateTab, closeTab, split, getEnv.
      
      Current layout: 2x2 grid with lecture, quiz, diagram, and summary panes.
      Each pane can contain multiple tabs that users can switch between.
      
      Available Panes: ${layoutState.availablePanes.join(', ')}
      Available Tabs: ${layoutState.availableTabs.map(t => `"${t.name}" (${t.id}) in ${t.paneId}`).join(', ')}`,
    
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
      // Validate that we have layout state
      if (!layoutState) {
        return {
          success: false,
          error: 'Layout state not provided',
          command: null
        };
      }

      const { availablePanes, availableTabs } = layoutState;
      
      // Generate the command to be executed on the client
      let command: LayoutCommand;
      
      switch (action) {
        case 'addTab':
          if (!paneId || !title || !contentId) {
            return {
              success: false,
              error: 'Missing required parameters for addTab: paneId, title, contentId',
              availablePanes,
              availableTabs,
              hint: `Available panes: ${availablePanes.join(', ')}`,
              command: null
            };
          }
          
          if (!availablePanes.includes(paneId)) {
            return {
              success: false,
              error: `Pane ${paneId} not found`,
              availablePanes,
              availableTabs,
              hint: `Available panes: ${availablePanes.join(', ')}`,
              command: null
            };
          }
          
          command = {
            action: 'addTab',
            paneId,
            title,
            contentId,
            makeActive: makeActive ?? true
          };
          break;
          
        case 'activateTab':
          if (!paneId || !tabId) {
            return {
              success: false,
              error: 'Missing required parameters for activateTab: paneId, tabId',
              availablePanes,
              availableTabs,
              hint: `Available tabs: ${availableTabs.map(t => `${t.name} (${t.id})`).join(', ')}`,
              command: null
            };
          }
          
          const tabExists = availableTabs.some(t => t.id === tabId);
          if (!tabExists) {
            return {
              success: false,
              error: `Tab ${tabId} not found`,
              availablePanes,
              availableTabs,
              hint: `Available tabs: ${availableTabs.map(t => `${t.name} (${t.id})`).join(', ')}`,
              command: null
            };
          }
          
          command = {
            action: 'activateTab',
            paneId,
            tabId
          };
          break;
          
        case 'closeTab':
          if (!tabId) {
            return {
              success: false,
              error: 'Missing required parameter for closeTab: tabId',
              availablePanes,
              availableTabs,
              hint: `Available tabs: ${availableTabs.map(t => `${t.name} (${t.id})`).join(', ')}`,
              command: null
            };
          }
          
          const tabToClose = availableTabs.find(t => t.id === tabId);
          if (!tabToClose) {
            return {
              success: false,
              error: `Tab ${tabId} not found`,
              availablePanes,
              availableTabs,
              hint: `Available tabs: ${availableTabs.map(t => `${t.name} (${t.id})`).join(', ')}`,
              command: null
            };
          }
          
          command = {
            action: 'closeTab',
            tabId
          };
          break;
          
        case 'split':
          if (!paneId || !orientation) {
            return {
              success: false,
              error: 'Missing required parameters for split: paneId, orientation',
              availablePanes,
              availableTabs,
              hint: `Available panes: ${availablePanes.join(', ')}, orientations: row, column`,
              command: null
            };
          }
          
          if (!availablePanes.includes(paneId)) {
            return {
              success: false,
              error: `Pane ${paneId} not found`,
              availablePanes,
              availableTabs,
              hint: `Available panes: ${availablePanes.join(', ')}`,
              command: null
            };
          }
          
          command = {
            action: 'split',
            paneId,
            orientation,
            ratio: ratio ?? 0.5
          };
          break;
          
        case 'getEnv':
          return {
            success: true,
            message: 'Current layout environment',
            environment: {
              availablePanes,
              availableTabs,
              totalPanes: availablePanes.length,
              totalTabs: availableTabs.length,
              layoutStructure: 'Current layout has panes that can contain multiple tabs'
            },
            command: null
          };
          
        default:
          return {
            success: false,
            error: `Unknown action: ${action}`,
            availablePanes,
            availableTabs,
            command: null
          };
      }
      
      // Return the command for client execution
      return {
        success: true,
        message: `Generated ${action} command`,
        command,
        action: action
      };
      
    } catch (error) {
      return {
        success: false,
        error: 'Unexpected error in layout tool execution',
        details: error instanceof Error ? error.message : 'Unknown error',
        command: null
      };
    }
    }
  });
}

/**
 * Helper function to format layout state for AI context
 */
export function formatLayoutContext(layoutState: LayoutState): string {
  if (!layoutState) {
    return 'Layout system not available';
  }
  
  const { availablePanes, availableTabs } = layoutState;
  
  return `Current Layout State:
- Available Panes: ${availablePanes.join(', ')}
- Available Tabs: ${availableTabs.map(t => `"${t.name}" (${t.id}) in ${t.paneId}`).join(', ')}
- Total Panes: ${availablePanes.length}
- Total Tabs: ${availableTabs.length}

The layout supports adding new tabs, switching between tabs, closing tabs, and splitting panes.
Each pane can contain multiple tabs with different content types: lecture, quiz, diagram, summary, or placeholder.`;
}
