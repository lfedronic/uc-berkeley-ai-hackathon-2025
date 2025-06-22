'use client';

import React, { useState, useRef, useEffect } from 'react';
import { getCurrentFlexLayoutModel } from './FlexLayoutContainer';
import { 
  addTabToFlexLayout, 
  activateTabInFlexLayout, 
  closeTabInFlexLayout, 
  splitPaneInFlexLayout,
  getAvailablePaneIds,
  getAvailableTabIds
} from '@/lib/agents/flexLayoutTools';

interface ToolResult {
  result?: {
    action?: string;
    success?: boolean;
    message?: string;
    error?: string;
  };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolResults?: ToolResult[];
}

const AILayoutChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I can help you control the layout using natural language. Try commands like:\n\n• "Add a new quiz tab to the top-left pane"\n• "Split the diagram pane vertically"\n• "Switch to the summary tab"\n• "Show me the current layout"',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Get current layout state
      const model = getCurrentFlexLayoutModel();
      if (!model) {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, the layout system is not available right now.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }

      const availablePanes = getAvailablePaneIds(model);
      const availableTabs = getAvailableTabIds(model);
      
      const layoutState = {
        availablePanes,
        availableTabs,
        totalPanes: availablePanes.length,
        totalTabs: availableTabs.length
      };

      const response = await fetch('/api/layout-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          layoutState
        })
      });

      const data = await response.json();

      if (data.success) {
        // Execute any commands returned by the AI
        const executionResults: string[] = [];
        
        if (data.toolResults && data.toolResults.length > 0) {
          for (const toolResult of data.toolResults) {
            const command = toolResult.result?.command;
            if (command) {
              const execResult = await executeLayoutCommand(command);
              if (execResult) {
                executionResults.push(execResult);
              }
            }
          }
        }

        let assistantContent = data.response;
        if (executionResults.length > 0) {
          assistantContent += '\n\nExecution results:\n' + executionResults.join('\n');
        }

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date(),
          toolResults: data.toolResults
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Sorry, I encountered an error: ${data.error}${data.details ? ` (${data.details})` : ''}`,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, errorMessage]);
      }
    } catch {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I couldn\'t process your request. Please check your connection and try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const executeLayoutCommand = async (command: {
    action: string;
    paneId?: string;
    title?: string;
    contentId?: string;
    makeActive?: boolean;
    tabId?: string;
    orientation?: string;
    ratio?: number;
  }): Promise<string | null> => {
    const model = getCurrentFlexLayoutModel();
    if (!model) return 'Layout model not available';

    try {
      let result;
      
      switch (command.action) {
        case 'addTab':
          if (!command.paneId || !command.title || !command.contentId) {
            return '✗ Missing required parameters for addTab';
          }
          result = addTabToFlexLayout(
            model,
            command.paneId,
            command.title,
            command.contentId,
            command.makeActive ?? true
          );
          break;
          
        case 'activateTab':
          if (!command.paneId || !command.tabId) {
            return '✗ Missing required parameters for activateTab';
          }
          result = activateTabInFlexLayout(
            model,
            command.paneId,
            command.tabId
          );
          break;
          
        case 'closeTab':
          if (!command.tabId) {
            return '✗ Missing required parameter tabId for closeTab';
          }
          result = closeTabInFlexLayout(
            model,
            command.tabId
          );
          break;
          
        case 'split':
          if (!command.paneId || !command.orientation) {
            return '✗ Missing required parameters for split';
          }
          result = splitPaneInFlexLayout(
            model,
            command.paneId,
            command.orientation as 'row' | 'column',
            command.ratio ?? 0.5
          );
          break;
          
        default:
          return `Unknown command: ${command.action}`;
      }
      
      if (result.success) {
        return `✓ ${result.message}`;
      } else {
        return `✗ ${result.error}: ${result.message}`;
      }
    } catch (error) {
      return `✗ Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const exampleCommands = [
    "Add a homework tab to the quiz pane",
    "Split the lecture pane horizontally", 
    "Show current layout",
    "Close the diagram tab"
  ];

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h3 className="text-lg font-semibold text-gray-800">AI Layout Assistant</h3>
        <p className="text-sm text-gray-600">Control the layout with natural language</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
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
              
              {/* Show tool results if available */}
              {message.toolResults && message.toolResults.length > 0 && (
                <div className="mt-2 text-xs opacity-75">
                  <div className="font-medium">Actions performed:</div>
                  {message.toolResults.map((result, index) => (
                    <div key={index} className="mt-1">
                      • {result.result?.action || 'Layout action'}: {result.result?.success ? '✓' : '✗'}
                    </div>
                  ))}
                </div>
              )}
              
              <div className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
              }`}>
                {formatTimestamp(message.timestamp)}
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
              onClick={() => setInput(command)}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            >
              {command}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a layout command... (e.g., 'Add a new quiz tab')"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default AILayoutChat;
