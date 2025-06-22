'use client';

import React, { useState } from 'react';
import { layoutTool } from '@/lib/agents/layoutAgent';

const LayoutControls: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState('');
  const [params, setParams] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tools = [
    { value: 'split', label: 'Split Pane', params: ['targetId', 'orientation', 'ratio'] },
    { value: 'resize', label: 'Resize Pane', params: ['paneId', 'ratio'] },
    { value: 'addTab', label: 'Add Tab', params: ['paneId', 'title', 'contentId', 'makeActive'] },
    { value: 'activateTab', label: 'Activate Tab', params: ['paneId', 'tabId'] },
    { value: 'closeTab', label: 'Close Tab', params: ['paneId', 'tabId'] },
    { value: 'getEnv', label: 'Get Environment', params: [] },
  ];

  const handleToolChange = (toolValue: string) => {
    setSelectedTool(toolValue);
    setParams({});
    setResult(null);
    setError(null);
  };

  const handleParamChange = (paramName: string, value: string | number | boolean) => {
    setParams(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const executeTool = async () => {
    if (!selectedTool) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const toolParams = {
        verb: selectedTool as 'split' | 'resize' | 'remove' | 'assign' | 'addTab' | 'activateTab' | 'closeTab' | 'moveTab' | 'setLayout' | 'getEnv',
        ...params
      };

      console.log('Executing tool with params:', toolParams);
      // Call the tool's execute function directly
      const result = await layoutTool.execute(toolParams, {
        toolCallId: 'direct-call',
        messages: []
      });
      
      if (result.error) {
        setError(`${result.error}: ${result.message}`);
      } else {
        setResult(JSON.stringify(result, null, 2));
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
          Layout Tool Testing (Direct)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
            <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
              {result}
            </pre>
          </div>
        )}

        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <h4 className="text-sm font-medium mb-2">Zustand Store State (Correct IDs):</h4>
          <div className="text-xs">
            <p><strong>Available Pane IDs:</strong></p>
            <ul className="list-disc list-inside ml-2">
              <li>tabset-1 (Lecture Notes)</li>
              <li>tabset-2 (Quiz)</li>
              <li>tabset-3 (Diagram)</li>
              <li>tabset-4 (Summary)</li>
            </ul>
            <p className="mt-2"><strong>Available Tab IDs:</strong></p>
            <ul className="list-disc list-inside ml-2">
              <li>tab-lecture (in tabset-1)</li>
              <li>tab-quiz (in tabset-2)</li>
              <li>tab-diagram (in tabset-3)</li>
              <li>tab-summary (in tabset-4)</li>
            </ul>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          <p><strong>Status:</strong> ✅ Bidirectional sync implemented! Tools now update both Zustand store and FlexLayout UI</p>
          <p><strong>Test:</strong> Try adding a tab or activating a different tab to see real-time synchronization</p>
        </div>
      </div>
    </div>
  );
};

export default LayoutControls;
