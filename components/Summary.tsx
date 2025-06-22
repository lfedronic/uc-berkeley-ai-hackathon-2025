'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen, Clock, Target } from 'lucide-react';

interface SummaryProps {
  content: string;
  title?: string;
  topic?: string;
  type?: 'concept' | 'lesson-plan' | 'course-overview';
  onComplete?: () => void;
}

export default function Summary({ content, title, topic, type = 'concept', onComplete }: SummaryProps) {
  const getTypeIcon = () => {
    switch (type) {
      case 'lesson-plan':
        return <Target className="w-6 h-6 text-blue-600" />;
      case 'course-overview':
        return <BookOpen className="w-6 h-6 text-purple-600" />;
      default:
        return <Clock className="w-6 h-6 text-green-600" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'lesson-plan':
        return 'Lesson Plan';
      case 'course-overview':
        return 'Course Overview';
      default:
        return 'Concept Summary';
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'lesson-plan':
        return 'border-blue-200 bg-blue-50';
      case 'course-overview':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-green-200 bg-green-50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className={`rounded-lg border-2 ${getTypeColor()} p-6 mb-6`}>
        <div className="flex items-center space-x-3 mb-4">
          {getTypeIcon()}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {title || `${getTypeLabel()}: ${topic || 'Educational Content'}`}
            </h1>
            <p className="text-gray-600">{getTypeLabel()}</p>
          </div>
        </div>
        
        {topic && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Topic:</span> {topic}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
        
        {onComplete && (
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <button
              onClick={onComplete}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Mark as Complete
            </button>
          </div>
        )}
      </div>

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