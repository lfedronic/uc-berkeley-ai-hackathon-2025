'use client';

import React, { useState } from 'react';
import { getCurrentFlexLayoutModel } from './FlexLayoutContainer';
import { 
  addTabToFlexLayout, 
  activateTabInFlexLayout, 
  closeTabInFlexLayout, 
  splitPaneInFlexLayout,
  getEnvironmentFromFlexLayout,
  getAvailablePaneIds,
  getAvailableTabIds
} from '@/lib/agents/flexLayoutTools';

const LayoutControls: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState('');
  const [params, setParams] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [availablePanes, setAvailablePanes] = useState<string[]>([]);
  const [availableTabs, setAvailableTabs] = useState<Array<{ id: string; name: string; paneId: string }>>([]);

  const tools = [
    { value: 'addTab', label: 'Add Tab', params: ['paneId', 'title', 'contentId', 'makeActive'] },
    { value: 'activateTab', label: 'Activate Tab', params: ['paneId', 'tabId'] },
    { value: 'closeTab', label: 'Close Tab', params: ['tabId'] },
    { value: 'split', label: 'Split Pane', params: ['targetId', 'orientation', 'ratio'] },
    { value: 'getEnv', label: 'Get Environment', params: [] },
  ];

  const handleToolChange = (toolValue: string) => {
    setSelectedTool(toolValue);
    setParams({});
    setResult(null);
    setError(null);
    
    // Update available IDs when tool changes
    updateAvailableIds();
  };

  const updateAvailableIds = () => {
    const model = getCurrentFlexLayoutModel();
    if (model) {
      const panes = getAvailablePaneIds(model);
      const tabs = getAvailableTabIds(model);
      setAvailablePanes(panes);
      setAvailableTabs(tabs);
      console.log('📋 Available panes:', panes);
      console.log('📋 Available tabs:', tabs);
    }
  };

  const handleParamChange = (paramName: string, value: string | number | boolean) => {
    setParams(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const executeTool = async () => {
    if (!selectedTool) return;

    const model = getCurrentFlexLayoutModel();
    if (!model) {
      setError('FlexLayout model not available');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🔧 Executing FlexLayout tool:', selectedTool, params);
      
      let toolResult;
      
      switch (selectedTool) {
        case 'addTab':
          toolResult = addTabToFlexLayout(
            model,
            params.paneId as string,
            params.title as string,
            params.contentId as string,
            params.makeActive as boolean
          );
          break;
          
        case 'activateTab':
          toolResult = activateTabInFlexLayout(
            model,
            params.paneId as string,
            params.tabId as string
          );
          break;
          
        case 'closeTab':
          toolResult = closeTabInFlexLayout(
            model,
            params.tabId as string
          );
          break;
          
        case 'split':
          toolResult = splitPaneInFlexLayout(
            model,
            params.targetId as string,
            params.orientation as 'row' | 'column',
            params.ratio as number
          );
          break;
          
        case 'getEnv':
          toolResult = getEnvironmentFromFlexLayout(model);
          break;
          
        default:
          toolResult = { success: false, error: 'UNKNOWN_TOOL', message: `Tool ${selectedTool} not implemented` };
      }
      
      if (toolResult.success) {
        setResult(toolResult.message || 'Operation completed successfully');
        // Update available IDs after successful operation
        setTimeout(updateAvailableIds, 100);
      } else {
        setError(`${toolResult.error}: ${toolResult.message}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const selectedToolConfig = tools.find(t => t.value === selectedTool);

  const renderParamInput = (paramName: string) => {
    const value = params[paramName];
    
    if (paramName === 'paneId') {
      return (
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => handleParamChange(paramName, e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
        >
          <option value="">Select pane...</option>
          {availablePanes.map(paneId => (
            <option key={paneId} value={paneId}>
              {paneId}
            </option>
          ))}
        </select>
      );
    }
    
    if (paramName === 'tabId') {
      return (
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => handleParamChange(paramName, e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
        >
          <option value="">Select tab...</option>
          {availableTabs.map(tab => (
            <option key={tab.id} value={tab.id}>
              {tab.name} (in {tab.paneId})
            </option>
          ))}
        </select>
      );
    }
    
    if (paramName === 'targetId') {
      return (
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => handleParamChange(paramName, e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
        >
          <option value="">Select target...</option>
          {availablePanes.map(paneId => (
            <option key={paneId} value={paneId}>
              {paneId}
            </option>
          ))}
        </select>
      );
    }
    
    if (paramName === 'orientation') {
      return (
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => handleParamChange(paramName, e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="">Select orientation</option>
          <option value="row">Row</option>
          <option value="column">Column</option>
        </select>
      );
    }
    
    if (paramName === 'contentId') {
      return (
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => handleParamChange(paramName, e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
        >
          <option value="">Select content type...</option>
          <option value="lecture">Lecture</option>
          <option value="quiz">Quiz</option>
          <option value="diagram">Diagram</option>
          <option value="summary">Summary</option>
          <option value="placeholder">Placeholder</option>
        </select>
      );
    }
    
    if (paramName === 'makeActive') {
      return (
        <input
          type="checkbox"
          checked={typeof value === 'boolean' ? value : false}
          onChange={(e) => handleParamChange(paramName, e.target.checked)}
          className="rounded"
        />
      );
    }
    
    if (paramName === 'ratio') {
      return (
        <input
          type="number"
          min="0.1"
          max="0.9"
          step="0.1"
          value={typeof value === 'number' ? value : ''}
          onChange={(e) => handleParamChange(paramName, parseFloat(e.target.value))}
          placeholder="0.5"
          className="px-2 py-1 border border-gray-300 rounded text-sm w-20"
        />
      );
    }
    
    return (
      <input
        type="text"
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => handleParamChange(paramName, e.target.value)}
        placeholder={`Enter ${paramName}`}
        className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
      />
    );
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">
          FlexLayout Tool Testing (Direct)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Tool:</label>
            <select
              value={selectedTool}
              onChange={(e) => handleToolChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a tool...</option>
              {tools.map(tool => (
                <option key={tool.value} value={tool.value}>
                  {tool.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <button
              onClick={updateAvailableIds}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 mt-6"
            >
              Refresh IDs
            </button>
          </div>
          
          <div>
            <button
              onClick={executeTool}
              disabled={!selectedTool || loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? 'Executing...' : 'Execute Tool'}
            </button>
          </div>
        </div>

        {selectedToolConfig && selectedToolConfig.params.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Parameters:</label>
            <div className="space-y-2">
              {selectedToolConfig.params.map(paramName => (
                <div key={paramName} className="flex items-center gap-2">
                  <span className="text-sm font-medium w-20">{paramName}:</span>
                  {renderParamInput(paramName)}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {result && (
          <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 text-sm font-medium mb-2">Result:</p>
            <p className="text-sm">{result}</p>
          </div>
        )}

        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <h4 className="text-sm font-medium mb-2">FlexLayout State (Live IDs):</h4>
          <div className="text-xs">
            <p><strong>Available Pane IDs:</strong></p>
            <ul className="list-disc list-inside ml-2">
              {availablePanes.map(paneId => (
                <li key={paneId}>{paneId}</li>
              ))}
            </ul>
            <p className="mt-2"><strong>Available Tab IDs:</strong></p>
            <ul className="list-disc list-inside ml-2">
              {availableTabs.map(tab => (
                <li key={tab.id}>{tab.name} ({tab.id}) in {tab.paneId}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          <p><strong>Architecture:</strong> FlexLayout-only (no Zustand) - Single source of truth</p>
          <p><strong>Note:</strong> Tab switching should now work properly after dragging tabs together</p>
        </div>
      </div>
    </div>
  );
};

export default LayoutControls;
