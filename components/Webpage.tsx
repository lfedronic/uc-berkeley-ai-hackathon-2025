'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GeneratedWebpage } from '@/lib/agents/webpageAgent';
import { Copy, Download, Code, Eye, FileText } from 'lucide-react';

interface WebpageProps {
  webpage: GeneratedWebpage;
}

export default function Webpage({ webpage }: WebpageProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Update iframe content when webpage changes
  useEffect(() => {
    if (activeTab === 'preview' && iframeRef.current && webpage.type === 'interactive-html') {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(webpage.code);
        doc.close();
      }
    }
  }, [activeTab, webpage.code, webpage.type]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(webpage.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const downloadCode = () => {
    const extension = webpage.type === 'python-chart' ? '.py' : '.html';
    const filename = `${webpage.title.toLowerCase().replace(/\s+/g, '-')}${extension}`;
    const blob = new Blob([webpage.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLanguage = () => {
    if (webpage.type === 'python-chart') return 'python';
    return 'html';
  };

  const renderPreview = () => {
    if (webpage.type === 'interactive-html') {
      return (
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0 bg-white rounded"
          title={webpage.title}
          sandbox="allow-scripts allow-same-origin"
        />
      );
    } else if (webpage.type === 'python-chart') {
      return (
        <div className="h-full flex items-center justify-center bg-gray-50 rounded">
          <div className="text-center p-8">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Python Code</h3>
            <p className="text-gray-600 mb-4">
              This Python code creates a data visualization or chart.
            </p>
            <p className="text-sm text-gray-500">
              Copy the code and run it in a Python environment with the required libraries.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded">
        <div className="text-center p-8">
          <Code className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Code Preview</h3>
          <p className="text-gray-600">
            Switch to the Code tab to view the generated content.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">{webpage.title}</h2>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {webpage.framework}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {webpage.type}
            </span>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-3">{webpage.description}</p>
        
        {webpage.instructions && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-blue-900 mb-1">How to Use:</h4>
            <p className="text-sm text-blue-800">{webpage.instructions}</p>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-4">
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'preview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Preview
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'code'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Code className="w-4 h-4 inline mr-2" />
            Code
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'preview' ? (
          <div className="h-full p-4">
            {renderPreview()}
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Code Actions */}
            <div className="border-b border-gray-200 p-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {getLanguage().toUpperCase()} Code
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={copyToClipboard}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={downloadCode}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </button>
                </div>
              </div>
            </div>

            {/* Code Display */}
            <div className="flex-1 overflow-auto p-4 bg-gray-900">
              <pre className="text-sm text-gray-100 font-mono leading-relaxed">
                <code>{webpage.code}</code>
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="border-t border-gray-200 p-3 bg-gray-50">
        <div className="text-xs text-gray-500 flex items-center justify-between">
          <span>Educational content for: {webpage.concept}</span>
          {webpage.type === 'python-chart' && (
            <span className="text-orange-600">
              ⚠️ Python code requires appropriate libraries to run
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 