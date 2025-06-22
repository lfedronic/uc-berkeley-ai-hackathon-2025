'use client';

import React, { useEffect, useRef } from 'react';
import { GeneratedDiagram } from '@/lib/agents/diagramAgent';

interface DiagramProps {
  diagram: GeneratedDiagram;
}

export default function Diagram({ diagram }: DiagramProps) {
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!diagramRef.current) return;

      try {
        // Dynamically import mermaid to avoid SSR issues
        const mermaid = (await import('mermaid')).default;
        
        // Initialize mermaid with configuration
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'Google Sans, Roboto, Helvetica, Arial, sans-serif',
          fontSize: 14,
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis',
          },
          mindmap: {
            useMaxWidth: true,
          },
          sequence: {
            useMaxWidth: true,
            showSequenceNumbers: true,
          },
          class: {
            useMaxWidth: true,
          },
          timeline: {
            useMaxWidth: true,
          },
        });

        // Clear previous content
        diagramRef.current.innerHTML = '';
        
        // Generate unique ID for this diagram
        const diagramId = `diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Render the diagram
        const { svg } = await mermaid.render(diagramId, diagram.mermaidCode);
        
        // Insert the SVG
        diagramRef.current.innerHTML = svg;
        
        // Add responsive styling
        const svgElement = diagramRef.current.querySelector('svg');
        if (svgElement) {
          svgElement.style.maxWidth = '100%';
          svgElement.style.height = 'auto';
        }
        
      } catch (error) {
        console.error('Error rendering Mermaid diagram:', error);
        if (diagramRef.current) {
          diagramRef.current.innerHTML = `
            <div class="flex items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg">
              <div class="text-center">
                <div class="text-red-600 mb-2">
                  <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                </div>
                <h3 class="font-semibold text-red-800">Diagram Error</h3>
                <p class="text-red-600 text-sm mt-1">Unable to render the diagram</p>
              </div>
            </div>
          `;
        }
      }
    };

    renderDiagram();
  }, [diagram.mermaidCode]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{diagram.title}</h1>
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {diagram.type}
          </span>
          <span>Concept: {diagram.concept}</span>
        </div>
        <p className="text-gray-700">{diagram.description}</p>
      </div>

      {/* Diagram Container */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div 
          ref={diagramRef}
          className="flex justify-center items-center min-h-[200px] w-full overflow-x-auto"
        />
      </div>

      {/* Mermaid Code (Collapsible) */}
      <details className="bg-gray-50 rounded-lg border border-gray-200">
        <summary className="cursor-pointer p-4 font-medium text-gray-900 hover:bg-gray-100">
          View Mermaid Code
        </summary>
        <div className="p-4 pt-0">
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{diagram.mermaidCode}</code>
          </pre>
          <p className="text-xs text-gray-600 mt-2">
            You can copy this code and use it in any Mermaid-compatible editor or documentation.
          </p>
        </div>
      </details>
    </div>
  );
} 