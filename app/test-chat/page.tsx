'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChatPopup from '@/components/ChatPopup';
import Quiz from '@/components/Quiz';
import { GeneratedQuiz } from '@/lib/agents/quizAgent';

type ContentType = 'summary' | 'quiz' | null;

export default function TestChatPage() {
  const [lessonContent, setLessonContent] = useState<string>('');
  const [currentQuiz, setCurrentQuiz] = useState<GeneratedQuiz | null>(null);
  const [contentType, setContentType] = useState<ContentType>(null);

  const handleLessonUpdate = (content: string) => {
    setLessonContent(content);
    setCurrentQuiz(null);
    setContentType('summary');
  };

  const handleQuizUpdate = (quiz: GeneratedQuiz) => {
    setCurrentQuiz(quiz);
    setLessonContent('');
    setContentType('quiz');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Learning Platform
          </h1>
          <p className="text-lg text-gray-600">
            Use the chat assistant to generate lesson plans, summaries, and course overviews
          </p>
        </div>

                {/* Content Display */}
        <div className="bg-white rounded-2xl shadow-xl mb-8">
          {contentType === 'summary' && lessonContent ? (
            <div className="p-8">
              <div className="markdown-content">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                >
                  {lessonContent}
                </ReactMarkdown>
              </div>
            </div>
          ) : contentType === 'quiz' && currentQuiz ? (
            <Quiz quiz={currentQuiz} />
          ) : (
            <div className="p-8">
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No content yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Click the chat button to ask the AI assistant to generate educational content or quizzes for you.
                </p>
                <div className="bg-blue-50 rounded-lg p-6 max-w-2xl mx-auto">
                  <h4 className="font-semibold text-blue-900 mb-3">Try asking for:</h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      <span>&quot;Can you give me a summary of photosynthesis?&quot;</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      <span>&quot;Create a lesson plan for basic algebra&quot;</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      <span>&quot;Generate a quiz on JavaScript fundamentals&quot;</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      <span>&quot;Make a practice test for calculus&quot;</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4">
            How to Use the Learning Platform
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">🎯 Content Types</h3>
              <ul className="space-y-1 text-sm text-blue-700">
                <li><strong>Concept Summaries:</strong> Quick overviews of topics</li>
                <li><strong>Lesson Plans:</strong> Structured teaching materials</li>
                <li><strong>Course Overviews:</strong> Complete curriculum outlines</li>
                <li><strong>Interactive Quizzes:</strong> MCQ, short answer, true/false questions</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">⚙️ Setup Required</h3>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>1. Create <code className="bg-blue-200 px-1 rounded">.env.local</code> file</li>
                <li>2. Add <code className="bg-blue-200 px-1 rounded">GOOGLE_API_KEY=your_key</code></li>
                <li>3. Get API key from <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="underline">ai.google.dev</a></li>
                <li>4. Restart development server</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Popup */}
      <ChatPopup onLessonUpdate={handleLessonUpdate} onQuizUpdate={handleQuizUpdate} />

      {/* Custom CSS for textbook-style markdown */}
      <style jsx global>{`
        .markdown-content {
          font-family: 'Georgia', 'Times New Roman', serif;
          line-height: 1.7;
          color: #2d3748;
          max-width: none;
        }
        
        .markdown-content h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1a202c;
          margin-top: 0;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 3px solid #3182ce;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .markdown-content h2 {
          font-size: 2rem;
          font-weight: 600;
          color: #2d3748;
          margin-top: 3rem;
          margin-bottom: 1.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #e2e8f0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .markdown-content h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #2d3748;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .markdown-content h4 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #4a5568;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .markdown-content p {
          margin-bottom: 1.5rem;
          font-size: 1.1rem;
          text-align: justify;
          text-justify: inter-word;
        }
        
        .markdown-content ul, .markdown-content ol {
          margin-bottom: 1.5rem;
          padding-left: 2rem;
        }
        
        .markdown-content ul {
          list-style-type: disc;
        }
        
        .markdown-content ol {
          list-style-type: decimal;
        }
        
        .markdown-content li {
          margin-bottom: 0.5rem;
          font-size: 1.1rem;
          line-height: 1.6;
        }
        
        .markdown-content li::marker {
          color: #3182ce;
          font-weight: bold;
        }
        
        .markdown-content strong {
          font-weight: 700;
          color: #1a202c;
        }
        
        .markdown-content em {
          font-style: italic;
          color: #4a5568;
        }
        
        .markdown-content code {
          background-color: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          padding: 0.25rem 0.5rem;
          font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
          font-size: 0.9rem;
          color: #d53f8c;
        }
        
        .markdown-content pre {
          background-color: #1a202c;
          color: #e2e8f0;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin: 1.5rem 0;
          overflow-x: auto;
          font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
          font-size: 0.95rem;
          line-height: 1.5;
        }
        
        .markdown-content pre code {
          background: none;
          border: none;
          padding: 0;
          color: inherit;
          font-size: inherit;
        }
        
        .markdown-content blockquote {
          border-left: 4px solid #3182ce;
          background-color: #ebf8ff;
          padding: 1rem 1.5rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: #2c5282;
          border-radius: 0 0.375rem 0.375rem 0;
        }
        
        .markdown-content blockquote p {
          margin-bottom: 0;
        }
        
        .markdown-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          font-size: 1rem;
        }
        
        .markdown-content th, .markdown-content td {
          border: 1px solid #e2e8f0;
          padding: 0.75rem;
          text-align: left;
        }
        
        .markdown-content th {
          background-color: #f7fafc;
          font-weight: 600;
          color: #2d3748;
        }
        
        .markdown-content tr:nth-child(even) {
          background-color: #f9fafb;
        }
        
        .markdown-content hr {
          border: none;
          height: 2px;
          background: linear-gradient(to right, #3182ce, #63b3ed, #3182ce);
          margin: 3rem 0;
          border-radius: 1px;
        }
        
        /* Special styling for learning objectives and key points */
        .markdown-content ul li:first-child {
          margin-top: 0.5rem;
        }
        
        .markdown-content h2 + ul,
        .markdown-content h3 + ul {
          margin-top: 1rem;
        }
        
        /* Add some breathing room around sections */
        .markdown-content > *:first-child {
          margin-top: 0;
        }
        
        .markdown-content > *:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
} 