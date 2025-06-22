import { Model, Actions, DockLocation, IJsonModel } from 'flexlayout-react';

/**
 * FlexLayout-native tool system
 * All tools work directly with FlexLayout's Model and Actions API
 */

export interface FlexLayoutToolResult {
  success: boolean;
  error?: string;
  message?: string;
  model?: Model;
}

/**
 * Add a new tab to a tabset
 */
export function addTabToFlexLayout(
  model: Model, 
  paneId: string, 
  title: string, 
  contentId: string,
  makeActive: boolean = false
): FlexLayoutToolResult {
  try {
    const node = model.getNodeById(paneId);
    if (!node) {
      return { success: false, error: 'PANE_NOT_FOUND', message: `Pane ${paneId} not found` };
    }

    if (node.getType() !== 'tabset') {
      return { success: false, error: 'INVALID_TARGET', message: 'Target must be a tabset' };
    }

    // Create new tab
    const newTabId = `tab-${Date.now()}`;
    const action = Actions.addNode(
      {
        type: 'tab',
        id: newTabId,
        name: title,
        component: 'content',
        config: { contentType: contentId, bgColor: getBgColorForContent(contentId) }
      },
      paneId,
      DockLocation.CENTER, // Add to existing tabset
      makeActive ? 0 : -1, // 0 = make active, -1 = add to end
      makeActive // Select the new tab if makeActive is true
    );

    model.doAction(action);
    
    return { 
      success: true, 
      message: `Added tab "${title}" to pane ${paneId}`,
      model 
    };
  } catch (error) {
    return { 
      success: false, 
      error: 'EXECUTION_ERROR', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Activate a specific tab
 */
export function activateTabInFlexLayout(
  model: Model,
  paneId: string,
  tabId: string
): FlexLayoutToolResult {
  try {
    const paneNode = model.getNodeById(paneId);
    if (!paneNode || paneNode.getType() !== 'tabset') {
      return { success: false, error: 'INVALID_PANE', message: 'Pane must be a tabset' };
    }

    const tabNode = model.getNodeById(tabId);
    if (!tabNode || tabNode.getType() !== 'tab') {
      return { success: false, error: 'TAB_NOT_FOUND', message: `Tab ${tabId} not found` };
    }

    const action = Actions.selectTab(tabId);
    model.doAction(action);

    return { 
      success: true, 
      message: `Activated tab ${tabId} in pane ${paneId}`,
      model 
    };
  } catch (error) {
    return { 
      success: false, 
      error: 'EXECUTION_ERROR', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Close a tab
 */
export function closeTabInFlexLayout(
  model: Model,
  tabId: string
): FlexLayoutToolResult {
  try {
    const tabNode = model.getNodeById(tabId);
    if (!tabNode || tabNode.getType() !== 'tab') {
      return { success: false, error: 'TAB_NOT_FOUND', message: `Tab ${tabId} not found` };
    }

    // Allow closing the last tab - this will remove the entire pane
    // AI should have full control over layout management

    const action = Actions.deleteTab(tabId);
    model.doAction(action);

    return { 
      success: true, 
      message: `Closed tab ${tabId}`,
      model 
    };
  } catch (error) {
    return { 
      success: false, 
      error: 'EXECUTION_ERROR', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Split a pane (create a new tabset)
 */
export function splitPaneInFlexLayout(
  model: Model,
  targetId: string,
  orientation: 'row' | 'column',
  ratio: number = 0.5
): FlexLayoutToolResult {
  try {
    const targetNode = model.getNodeById(targetId);
    if (!targetNode) {
      return { success: false, error: 'NODE_NOT_FOUND', message: `Node ${targetId} not found` };
    }

    // Create a new tabset with a placeholder tab
    const newTabsetId = `tabset-${Date.now()}`;
    const newTabId = `tab-${Date.now()}`;
    
    // Map orientation to DockLocation
    const dockLocation = orientation === 'row' ? DockLocation.RIGHT : DockLocation.BOTTOM;
    
    const action = Actions.addNode(
      {
        type: 'tabset',
        id: newTabsetId,
        children: [{
          type: 'tab',
          id: newTabId,
          name: 'New Tab',
          component: 'content',
          config: { contentType: 'placeholder', bgColor: 'bg-gray-100' }
        }]
      },
      targetId,
      dockLocation, // Use proper DockLocation
      0, // Index
      false // Don't select
    );

    model.doAction(action);

    return { 
      success: true, 
      message: `Split pane ${targetId} with orientation ${orientation}`,
      model 
    };
  } catch (error) {
    return { 
      success: false, 
      error: 'EXECUTION_ERROR', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get environment information from FlexLayout model
 */
export function getEnvironmentFromFlexLayout(model: Model): FlexLayoutToolResult {
  try {
    const modelJson = model.toJson();
    
    // Extract pane information
    const panes: Array<{
      id: string;
      type: string;
      tabs: Array<{ id: string; name: string; contentType: string }>;
      activeTab?: string;
    }> = [];

    const extractPanes = (node: any) => {
      if (node.type === 'tabset') {
        const tabs = node.children?.map((child: any) => ({
          id: child.id,
          name: child.name,
          contentType: child.config?.contentType || 'default'
        })) || [];

        panes.push({
          id: node.id,
          type: 'tabset',
          tabs,
          activeTab: tabs[node.active || 0]?.id
        });
      } else if (node.children) {
        node.children.forEach(extractPanes);
      }
    };

    extractPanes(modelJson.layout);

    return {
      success: true,
      message: 'Environment retrieved successfully',
      model,
      // Return environment data in the message for now
    };
  } catch (error) {
    return { 
      success: false, 
      error: 'EXECUTION_ERROR', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Helper function to get background color for content type
 */
function getBgColorForContent(contentType: string): string {
  switch (contentType) {
    case 'lecture': return 'bg-blue-100';
    case 'quiz': return 'bg-green-100';
    case 'diagram': return 'bg-purple-100';
    case 'summary': return 'bg-yellow-100';
    default: return 'bg-gray-100';
  }
}

/**
 * Get all available pane IDs from the model
 */
export function getAvailablePaneIds(model: Model): string[] {
  const paneIds: string[] = [];
  
  const extractPaneIds = (node: any) => {
    if (node.type === 'tabset') {
      paneIds.push(node.id);
    } else if (node.children) {
      node.children.forEach(extractPaneIds);
    }
  };

  extractPaneIds(model.toJson().layout);
  return paneIds;
}

/**
 * Get all available tab IDs from the model
 */
export function getAvailableTabIds(model: Model): Array<{ id: string; name: string; paneId: string }> {
  const tabs: Array<{ id: string; name: string; paneId: string }> = [];
  
  const extractTabs = (node: any, paneId?: string) => {
    if (node.type === 'tabset') {
      const currentPaneId = node.id;
      node.children?.forEach((child: any) => {
        if (child.type === 'tab') {
          tabs.push({
            id: child.id,
            name: child.name,
            paneId: currentPaneId
          });
        }
      });
    } else if (node.children) {
      node.children.forEach((child: any) => extractTabs(child, paneId));
    }
  };

  extractTabs(model.toJson().layout);
  return tabs;
}
