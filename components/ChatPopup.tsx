'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { X, MessageCircle } from 'lucide-react';

import { GeneratedQuiz } from '@/lib/agents/quizAgent';
import { GeneratedDiagram } from '@/lib/agents/diagramAgent';
import { GeneratedWebpage } from '@/lib/agents/webpageAgent';

interface ChatPopupProps {
  onLessonUpdate?: (content: string) => void;
  onQuizUpdate?: (quiz: GeneratedQuiz) => void;
  onDiagramUpdate?: (diagram: GeneratedDiagram) => void;
  onWebpageUpdate?: (webpage: GeneratedWebpage) => void;
}

export default function ChatPopup({ onLessonUpdate, onQuizUpdate, onDiagramUpdate, onWebpageUpdate }: ChatPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    onFinish: (message) => {
      // Check for summary results
      const summaryResults = message.toolInvocations?.filter(
        (tool) => tool.state === 'result' && tool.toolName === 'generateSummary'
      );
      
      if (summaryResults && summaryResults.length > 0) {
        const tool = summaryResults[0];
        if (tool.state === 'result' && tool.result?.success && tool.result?.content) {
          onLessonUpdate?.(tool.result.content);
        }
      }

      // Check for quiz results
      const quizResults = message.toolInvocations?.filter(
        (tool) => tool.state === 'result' && tool.toolName === 'generateQuiz'
      );
      
      if (quizResults && quizResults.length > 0) {
        const tool = quizResults[0];
        if (tool.state === 'result' && tool.result?.success && tool.result?.quiz) {
          onQuizUpdate?.(tool.result.quiz);
        }
      }

      // Check for diagram results
      const diagramResults = message.toolInvocations?.filter(
        (tool) => tool.state === 'result' && tool.toolName === 'generateDiagram'
      );
      
      if (diagramResults && diagramResults.length > 0) {
        const tool = diagramResults[0];
        if (tool.state === 'result' && tool.result?.success && tool.result?.diagram) {
          onDiagramUpdate?.(tool.result.diagram);
        }
      }

      // Check for webpage results
      const webpageResults = message.toolInvocations?.filter(
        (tool) => tool.state === 'result' && tool.toolName === 'generateWebpage'
      );
      
      if (webpageResults && webpageResults.length > 0) {
        const tool = webpageResults[0];
        if (tool.state === 'result' && tool.result?.success && tool.result?.webpage) {
          onWebpageUpdate?.(tool.result.webpage);
        }
      }
    },
  });

  const toggleChat = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 z-50"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Popup */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-2xl">
            <h3 className="font-semibold">AI Learning Assistant</h3>
            <button
              onClick={toggleChat}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <p className="text-sm">Ask me to create summaries, lesson plans, quizzes, or diagrams!</p>
                <div className="mt-4 space-y-2 text-xs text-gray-400">
                  <p>• &quot;Can you give me a summary of photosynthesis?&quot;</p>
                  <p>• &quot;Create a lesson plan for basic algebra&quot;</p>
                  <p>• &quot;Generate a quiz on JavaScript fundamentals&quot;</p>
                  <p>• &quot;Show me a diagram of the water cycle&quot;</p>
                  <p>• &quot;Create an interactive demo of context switching&quot;</p>
                  <p>• &quot;Build a physics simulation for pendulum motion&quot;</p>
                  <p>• &quot;Make a Python chart showing data distributions&quot;</p>
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
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Display tool invocations */}
                  {message.toolInvocations && message.toolInvocations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      {message.toolInvocations.map((tool, index) => (
                        <div key={index} className="text-xs">
                          {tool.state === 'result' && tool.toolName === 'generateSummary' && (
                            <div className="text-green-600">
                              ✓ Generated {tool.result?.type || 'content'} for &quot;{tool.result?.concept}&quot;
                              {tool.result?.success && (
                                <div className="text-blue-600 mt-1">
                                  Content updated on main page!
                                </div>
                              )}
                            </div>
                          )}
                          {tool.state === 'result' && tool.toolName === 'generateQuiz' && (
                            <div className="text-green-600">
                              ✓ Generated quiz on &quot;{tool.result?.topic}&quot;
                              {tool.result?.success && (
                                <div className="text-blue-600 mt-1">
                                  Quiz loaded on main page!
                                </div>
                              )}
                            </div>
                          )}
                          {tool.state === 'call' && tool.toolName === 'generateSummary' && (
                            <div className="text-orange-600">
                              🔄 Generating {tool.args?.type || 'content'}...
                            </div>
                          )}
                          {tool.state === 'call' && tool.toolName === 'generateQuiz' && (
                            <div className="text-orange-600">
                              🔄 Creating quiz on {tool.args?.topic}...
                            </div>
                          )}
                          {tool.state === 'result' && tool.toolName === 'generateDiagram' && (
                            <div className="text-green-600">
                              ✓ Generated diagram for &quot;{tool.result?.concept}&quot;
                              {tool.result?.success && (
                                <div className="text-blue-600 mt-1">
                                  Diagram created as new tab!
                                </div>
                              )}
                            </div>
                          )}
                          {tool.state === 'call' && tool.toolName === 'generateDiagram' && (
                            <div className="text-orange-600">
                              🔄 Creating diagram for {tool.args?.concept}...
                            </div>
                          )}
                          {tool.state === 'result' && tool.toolName === 'generateWebpage' && (
                            <div className="text-green-600">
                              ✓ Generated interactive demo for &quot;{tool.result?.concept}&quot;
                              {tool.result?.success && (
                                <div className="text-blue-600 mt-1">
                                  Interactive content created as new tab!
                                </div>
                              )}
                            </div>
                          )}
                          {tool.state === 'call' && tool.toolName === 'generateWebpage' && (
                            <div className="text-orange-600">
                              🔄 Building interactive demo for {tool.args?.concept}...
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
                <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <div className="p-4 border-t border-gray-200">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask for a summary or lesson plan..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
} 