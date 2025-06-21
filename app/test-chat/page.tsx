'use client';

import { useChat } from 'ai/react';

export default function TestChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Chat with Tool Calls
          </h1>
          <p className="text-lg text-gray-600">
            Try asking me to print "yes" or "no" and I'll use the appropriate tool!
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* Messages */}
          <div className="h-96 overflow-y-auto mb-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <p>No messages yet. Try asking me to print "yes" or "no"!</p>
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">Example prompts:</p>
                  <div className="text-sm text-gray-400">
                    <p>• "Please print yes"</p>
                    <p>• "Can you print no to the console?"</p>
                    <p>• "I need a positive response - print yes"</p>
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-3xl rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="text-sm font-medium mb-1">
                    {message.role === 'user' ? 'You' : 'Assistant'}
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Display tool invocations */}
                  {message.toolInvocations && message.toolInvocations.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <div className="text-xs font-medium text-gray-600 mb-2">
                        Tool Calls:
                      </div>
                      {message.toolInvocations.map((tool, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 rounded p-2 text-xs mb-2"
                        >
                          <div className="font-medium text-gray-800">
                            🔧 {tool.toolName}
                          </div>
                          {tool.result && (
                            <div className="text-gray-600 mt-1">
                              Result: {JSON.stringify(tool.result)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Assistant is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask me to print yes or no..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4">
            How to Set Up
          </h2>
          <div className="space-y-2 text-sm text-blue-800">
            <p>1. Create a <code className="bg-blue-200 px-1 rounded">.env.local</code> file in your project root</p>
            <p>2. Add your Google API key: <code className="bg-blue-200 px-1 rounded">GOOGLE_API_KEY=your_key_here</code></p>
            <p>3. Get your API key from <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="underline">https://ai.google.dev/</a></p>
            <p>4. Restart your development server</p>
          </div>
        </div>
      </div>
    </div>
  );
} 