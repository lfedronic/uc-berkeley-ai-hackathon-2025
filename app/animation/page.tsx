'use client';

import { useState } from 'react';

export default function AnimationPage() {
  const [query, setQuery] = useState('What is merge sort?');
  const [model, setModel] = useState<'gemini' | 'openai'>('gemini');
  const [autoRun, setAutoRun] = useState(false);
  const [outputFormat, setOutputFormat] = useState<'python' | 'mp4' | 'gif'>('python');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<string[]>([]);

  const generateAnimation = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/animation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          model,
          autoRun,
          outputFormat,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate animation');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/animation?action=templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Animation Generator</h1>
        <p className="text-gray-600">
          Generate Manim animations using AI. Describe what you want to animate and the system will create Python code for you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Generate Animation</h2>
          <p className="text-gray-600 mb-4">Describe what you want to animate</p>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="query" className="block text-sm font-medium mb-2">
                Animation Query
              </label>
              <textarea
                id="query"
                value={query}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuery(e.target.value)}
                placeholder="e.g., What is merge sort?"
                className="w-full p-3 border rounded-md min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="model" className="block text-sm font-medium mb-2">
                  Model
                </label>
                <select
                  id="model"
                  value={model}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setModel(e.target.value as 'gemini' | 'openai')}
                  className="w-full p-3 border rounded-md"
                >
                  <option value="gemini">Gemini</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>

              <div>
                <label htmlFor="format" className="block text-sm font-medium mb-2">
                  Output Format
                </label>
                <select
                  id="format"
                  value={outputFormat}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setOutputFormat(e.target.value as 'python' | 'mp4' | 'gif')}
                  className="w-full p-3 border rounded-md"
                >
                  <option value="python">Python Code</option>
                  <option value="mp4">MP4 Video</option>
                  <option value="gif">GIF Animation</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoRun"
                checked={autoRun}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAutoRun(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="autoRun" className="text-sm">
                Auto-run animation after generation
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={generateAnimation}
                disabled={isLoading || !query.trim()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Generating...' : 'Generate Animation'}
              </button>
              <button
                onClick={loadTemplates}
                disabled={isLoading}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Load Templates
              </button>
            </div>

            {templates.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Example Queries</label>
                <div className="grid grid-cols-1 gap-2">
                  {templates.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(template)}
                      className="text-left p-2 hover:bg-gray-100 rounded text-sm"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          <p className="text-gray-600 mb-4">Generated animation code and output</p>
          
          <div>
            {isLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Generating animation...</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {result.success ? (
                  <>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 font-medium">✅ Animation Generated Successfully</p>
                      {result.executionTime && (
                        <p className="text-sm text-green-600">
                          Generated in {result.executionTime}ms
                        </p>
                      )}
                    </div>

                    {result.className && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Class Name</label>
                        <input
                          value={result.className}
                          readOnly
                          className="w-full p-3 border rounded-md bg-gray-50"
                        />
                      </div>
                    )}

                    {result.filePath && (
                      <div>
                        <label className="block text-sm font-medium mb-2">File Path</label>
                        <input
                          value={result.filePath}
                          readOnly
                          className="w-full p-3 border rounded-md bg-gray-50"
                        />
                      </div>
                    )}

                    {result.pythonCode && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Generated Python Code</label>
                        <textarea
                          value={result.pythonCode}
                          readOnly
                          className="w-full p-3 border rounded-md bg-gray-50 font-mono text-sm min-h-[300px]"
                        />
                      </div>
                    )}

                    {result.outputFiles && result.outputFiles.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Output Files</label>
                        <div className="space-y-1">
                          {result.outputFiles.map((file: string, index: number) => (
                            <div key={index} className="text-sm bg-gray-100 p-2 rounded">
                              {file}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 font-medium">Generation Failed</p>
                    <p className="text-sm">{result.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 