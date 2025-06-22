'use client';

import React, { useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { getCurrentFlexLayoutModel } from './FlexLayoutContainer';
import { 
  addTabToFlexLayout, 
  activateTabInFlexLayout, 
  closeTabInFlexLayout, 
  splitPaneInFlexLayout,
  getAvailablePaneIds,
  getAvailableTabIds
} from '@/lib/agents/flexLayoutTools';

const AILayoutChat: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Collect current layout state for context
  const collectLayoutState = () => {
    const model = getCurrentFlexLayoutModel();
    if (!model) return null;

    const availablePanes = getAvailablePaneIds(model);
    const availableTabs = getAvailableTabIds(model);
    
    return {
      availablePanes,
      availableTabs,
      totalPanes: availablePanes.length,
      totalTabs: availableTabs.length
    };
  };

  // Create semantic mapping from friendly names to actual IDs
  const createSemanticMapping = () => {
    const layoutState = collectLayoutState();
    if (!layoutState) return { paneMapping: {}, tabMapping: {} };

    const paneMapping: Record<string, string> = {};
    const tabMapping: Record<string, string> = {};

    // Group tabs by pane
    const paneToTabs: Record<string, any[]> = {};
    layoutState.availableTabs.forEach((tab: any) => {
      if (!paneToTabs[tab.paneId]) {
        paneToTabs[tab.paneId] = [];
      }
      paneToTabs[tab.paneId].push(tab);
    });

    // Create semantic mappings
    layoutState.availablePanes.forEach((paneId: string) => {
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
        
        paneMapping[semanticPaneName] = paneId;
        
        // Map individual tabs
        tabs.forEach(tab => {
          const tabName = tab.name.toLowerCase().replace(/\s+/g, '-');
          tabMapping[`${tabName}-tab`] = tab.id;
        });
      }
    });

    return { paneMapping, tabMapping };
  };

  const { messages, input, handleInputChange, handleSubmit, isLoading, addToolResult } = useChat({
    api: '/api/layout-agent',
    onToolCall: async ({ toolCall }) => {
      console.log('🔧 Tool call received:', toolCall);
      
      if (toolCall.toolName === 'layout') {
        const args = toolCall.args as {
          action: string;
          paneId?: string;
          title?: string;
          contentId?: string;
          makeActive?: boolean;
          tabId?: string;
          orientation?: string;
          ratio?: number;
        };
        const { action, paneId, title, contentId, makeActive, tabId, orientation, ratio } = args;
        console.log('🔧 Executing layout action:', { action, paneId, title, contentId, makeActive, tabId, orientation, ratio });
        
        const model = getCurrentFlexLayoutModel();
        if (!model) {
          console.log('❌ FlexLayout model not available');
          addToolResult({
            toolCallId: toolCall.toolCallId,
            result: { success: false, error: 'Layout model not available' }
          });
          return;
        }

        try {
          let result;
          
          // Get semantic mappings
          const { paneMapping, tabMapping } = createSemanticMapping();
          console.log('🗺️ Semantic mappings:', { paneMapping, tabMapping });
          
          // Helper function to resolve semantic names to actual IDs
          const resolvePaneId = (inputPaneId: string) => {
            // Check if it's a semantic name
            if (paneMapping[inputPaneId]) {
              console.log(`🔄 Resolved semantic pane "${inputPaneId}" to ID: ${paneMapping[inputPaneId]}`);
              return paneMapping[inputPaneId];
            }
            
            // Check if it's already a valid pane ID
            const layoutState = collectLayoutState();
            if (layoutState?.availablePanes.includes(inputPaneId)) {
              return inputPaneId;
            }
            
            // Try partial matching as fallback
            const matchingTab = layoutState?.availableTabs.find(tab => 
              tab.name.toLowerCase().includes(inputPaneId.toLowerCase())
            );
            
            if (matchingTab) {
              console.log(`🔄 Fallback resolved "${inputPaneId}" to pane ID: ${matchingTab.paneId}`);
              return matchingTab.paneId;
            }
            
            console.log(`⚠️ Could not resolve pane ID: ${inputPaneId}`);
            return inputPaneId;
          };

          const resolveTabId = (inputTabId: string) => {
            // Check if it's a semantic name
            if (tabMapping[inputTabId]) {
              console.log(`🔄 Resolved semantic tab "${inputTabId}" to ID: ${tabMapping[inputTabId]}`);
              return tabMapping[inputTabId];
            }
            
            // Check if it's already a valid tab ID
            const layoutState = collectLayoutState();
            if (layoutState?.availableTabs.some(tab => tab.id === inputTabId)) {
              return inputTabId;
            }
            
            // Try partial matching as fallback
            const matchingTab = layoutState?.availableTabs.find(tab => 
              tab.name.toLowerCase().includes(inputTabId.toLowerCase())
            );
            
            if (matchingTab) {
              console.log(`🔄 Fallback resolved "${inputTabId}" to tab ID: ${matchingTab.id}`);
              return matchingTab.id;
            }
            
            console.log(`⚠️ Could not resolve tab ID: ${inputTabId}`);
            return inputTabId;
          };
          
          switch (action) {
            case 'addTab':
              if (!paneId || !title || !contentId) {
                result = { success: false, error: 'Missing required parameters for addTab' };
                break;
              }
              const resolvedPaneId = resolvePaneId(paneId);
              result = addTabToFlexLayout(model, resolvedPaneId, title, contentId, makeActive ?? true);
              break;
              
            case 'activateTab':
              if (!paneId || !tabId) {
                result = { success: false, error: 'Missing required parameters for activateTab' };
                break;
              }
              const resolvedActivePaneId = resolvePaneId(paneId);
              const resolvedActiveTabId = resolveTabId(tabId);
              result = activateTabInFlexLayout(model, resolvedActivePaneId, resolvedActiveTabId);
              break;
              
            case 'closeTab':
              if (!tabId) {
                result = { success: false, error: 'Missing required parameter tabId for closeTab' };
                break;
              }
              const resolvedCloseTabId = resolveTabId(tabId);
              result = closeTabInFlexLayout(model, resolvedCloseTabId);
              break;
              
            case 'split':
              if (!paneId || !orientation) {
                result = { success: false, error: 'Missing required parameters for split' };
                break;
              }
              const resolvedSplitPaneId = resolvePaneId(paneId);
              result = splitPaneInFlexLayout(model, resolvedSplitPaneId, orientation as 'row' | 'column', ratio ?? 0.5);
              break;
              
            case 'getEnv':
              const layoutState = collectLayoutState();
              result = {
                success: true,
                message: 'Current layout environment',
                environment: layoutState
              };
              break;
              
            default:
              result = { success: false, error: `Unknown action: ${action}` };
          }
          
          console.log('✅ Layout action result:', result);
          addToolResult({
            toolCallId: toolCall.toolCallId,
            result
          });
          
        } catch (error) {
          console.error('💥 Layout action error:', error);
          addToolResult({
            toolCallId: toolCall.toolCallId,
            result: { 
              success: false, 
              error: 'Execution error',
              details: error instanceof Error ? error.message : 'Unknown error'
            }
          });
        }
      }
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Collect current layout state to send as context
    const layoutState = collectLayoutState();
    console.log('📊 Sending layout state:', layoutState);
    
    // Submit with context - using data parameter for additional context
    handleSubmit(e, {
      data: {
        context: {
          layoutState
        }
      }
    });
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const exampleCommands = [
    "Add a homework tab to quiz-pane",
    "Split lecture-pane horizontally", 
    "Show current layout",
    "Close diagram-tab"
  ];

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h3 className="text-lg font-semibold text-gray-800">AI Layout Assistant</h3>
        <p className="text-sm text-gray-600">Control the layout with semantic names</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2 max-w-[80%]">
              <div className="whitespace-pre-wrap">
                Hi! I can help you control the layout using semantic names. Try commands like:

                • &quot;Add a homework tab to quiz-pane&quot;
                • &quot;Split lecture-pane vertically&quot;
                • &quot;Close diagram-tab&quot;
                • &quot;Show me the current layout&quot;
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatTimestamp(new Date())}
              </div>
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {/* Show tool calls if available */}
              {message.toolInvocations && message.toolInvocations.length > 0 && (
                <div className="mt-2 text-xs opacity-75">
                  <div className="font-medium">Actions performed:</div>
                  {message.toolInvocations.map((invocation, index) => (
                    <div key={index} className="mt-1">
                      • {invocation.toolName}: {invocation.args?.action || 'Layout action'}
                    </div>
                  ))}
                </div>
              )}
              
              <div className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
              }`}>
                {formatTimestamp(message.createdAt || new Date())}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Commands */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-gray-100">
        <div className="text-xs text-gray-500 mb-2">Quick commands:</div>
        <div className="flex flex-wrap gap-1">
          {exampleCommands.map((command, index) => (
            <button
              key={index}
              onClick={() => handleInputChange({ target: { value: command } } as any)}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            >
              {command}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200">
        <form onSubmit={handleFormSubmit} className="flex space-x-2">
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Type a layout command... (e.g., 'Add a homework tab to quiz-pane')"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleFormSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default AILayoutChat;
