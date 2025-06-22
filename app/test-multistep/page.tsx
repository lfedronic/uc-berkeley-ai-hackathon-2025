'use client';

import React, { useState } from 'react';
import { useChat } from 'ai/react';

export default function TestMultistepPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/test-multistep',
  });

  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runTest = async (testName: string, prompt: string) => {
    addTestResult(`Starting test: ${testName}`);
    // We'll manually trigger the test by setting the input and submitting
    const event = new Event('submit') as any;
    event.preventDefault = () => {};
    
    // Set the input value
    const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (inputElement) {
      inputElement.value = prompt;
      handleInputChange({ target: { value: prompt } } as any);
      handleSubmit(event);
    }
  };

  const testCases = [
    {
      name: "Single Tool Call",
      prompt: "Log a success message saying 'Single tool test works!'"
    },
    {
      name: "Two-Step Process", 
      prompt: "Execute a two-step process: first process the message 'Hello World', then perform action 'validate data'"
    },
    {
      name: "Three-Step Process",
      prompt: "Execute a complete three-step process: start with message 'Test Data', then perform action 'transform', then finish with final action 'save results'"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Multi-Step Tool Calling Test</h1>
        
        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Automated Tests</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testCases.map((test, index) => (
              <button
                key={index}
                onClick={() => runTest(test.name, test.prompt)}
                disabled={isLoading}
                className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-medium">{test.name}</div>
                <div className="text-sm opacity-90 mt-1">{test.prompt.substring(0, 50)}...</div>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Test Input */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Manual Test</h2>
          <form onSubmit={handleSubmit} className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Enter a test command... (e.g., 'Execute a three-step process with my data')"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Testing...' : 'Test'}
            </button>
          </form>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Test Results Log</h2>
            <div className="bg-gray-100 rounded p-4 max-h-40 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm text-gray-700 mb-1">
                  {result}
                </div>
              ))}
            </div>
            <button
              onClick={() => setTestResults([])}
              className="mt-2 px-4 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              Clear Log
            </button>
          </div>
        )}

        {/* Chat Messages */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Chat Messages</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.length === 0 && (
              <div className="text-gray-500 text-center py-8">
                No messages yet. Run a test to see the multi-step tool calling in action!
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-100 ml-8'
                    : 'bg-gray-100 mr-8'
                }`}
              >
                <div className="font-medium text-sm text-gray-600 mb-1">
                  {message.role === 'user' ? 'User' : 'Assistant'}
                </div>
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {/* Show tool invocations if available */}
                {message.toolInvocations && message.toolInvocations.length > 0 && (
                  <div className="mt-3 p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                    <div className="font-medium text-sm text-yellow-800 mb-2">
                      Tool Calls ({message.toolInvocations.length}):
                    </div>
                    {message.toolInvocations.map((invocation, index) => (
                      <div key={index} className="text-sm text-yellow-700 mb-1">
                        <strong>{invocation.toolName}:</strong> {JSON.stringify(invocation.args)}
                        {invocation.state === 'result' && (
                          <div className="ml-4 text-green-700">
                            → {JSON.stringify(invocation.result)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="bg-gray-100 mr-8 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  <span className="text-gray-600">Processing multi-step sequence...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Test</h3>
          <ul className="text-blue-800 space-y-1">
            <li>• <strong>Single Tool:</strong> &quot;Log a success message&quot;</li>
            <li>• <strong>Two Steps:</strong> &quot;Execute step one with 'test data', then step two with action 'process'&quot;</li>
            <li>• <strong>Three Steps:</strong> &quot;Execute a complete three-step process with my request&quot;</li>
            <li>• <strong>Check Console:</strong> Open browser dev tools to see the actual tool execution logs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
