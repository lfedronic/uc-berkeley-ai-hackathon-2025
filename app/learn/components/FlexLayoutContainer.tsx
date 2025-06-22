'use client';

import React, { useEffect, useRef } from 'react';
import { Layout, Model, TabNode, IJsonModel } from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import ResizeObserverComponent from './ResizeObserver';

// Initial layout configuration - starts empty, tabs added dynamically via chat
const initialModel: IJsonModel = {
  global: {
    tabEnableClose: true,
    tabEnableRename: false,
    borderSize: 25,
    enableRotateBorderIcons: false,
  },

  layout: {
    type: 'row',
    weight: 100,
    children: [
      {
        type: 'tabset',
        weight: 100,
        id: 'main-tabset',
        children: []
      }
    ]
  }
};

import Summary from '@/components/Summary';
import Quiz from '@/components/Quiz';

// Content component that renders different types based on config
const DynamicContent: React.FC<{ node: TabNode }> = ({ node }) => {
  const config = node.getConfig();
  const contentType = config?.contentType || 'default';
  const data = config?.data;
  
  switch (contentType) {
    case 'summary':
      if (data?.content) {
        return (
          <Summary
            content={data.content}
            title={data.title}
            topic={data.topic}
            type={data.type}
          />
        );
      }
      break;
      
    case 'quiz':
      if (data?.quiz) {
        return (
          <Quiz
            quiz={data.quiz}
            onComplete={(score, totalPoints) => {
              console.log(`Quiz completed: ${score}/${totalPoints}`);
            }}
          />
        );
      }
      break;
  }
  
  // Fallback placeholder content
  const bgColor = config?.bgColor || 'bg-gray-100';
  
  const getPlaceholderText = (type: string) => {
    switch (type) {
      case 'lecture':
        return 'Lecture Notes Content\n\nThis pane would contain lecture slides, PDFs, or educational content.';
      case 'quiz':
        return 'Quiz Content\n\nUse the chat to generate a quiz and it will appear here.';
      case 'diagram':
        return 'Diagram Content\n\nThis pane would contain visual diagrams, charts, and illustrations.';
      case 'summary':
        return 'Summary Content\n\nUse the chat to generate a summary and it will appear here.';
      default:
        return 'Default Content\n\nPlaceholder content for this pane.';
    }
  };

  return (
    <div className={`h-full w-full p-4 ${bgColor} flex flex-col`}>
      <h2 className="text-lg font-semibold mb-4 text-gray-800">
        {node.getName()}
      </h2>
      <div className="flex-1 text-gray-700 whitespace-pre-line">
        {getPlaceholderText(contentType)}
      </div>
      <div className="mt-4 text-xs text-gray-500">
        Pane ID: {node.getId()} | Type: {contentType}
      </div>
    </div>
  );
};

// Global model reference for tools to access
let globalModel: Model | null = null;

const FlexLayoutContainer: React.FC = () => {
  const [model, setModel] = React.useState<Model | null>(null);
  const modelRef = useRef<Model | null>(null);

  useEffect(() => {
    // Initialize the FlexLayout model - this is now our single source of truth
    const newModel = Model.fromJson(initialModel);
    setModel(newModel);
    modelRef.current = newModel;
    globalModel = newModel; // Make available to tools
    
    console.log('✅ FlexLayout initialized as single source of truth');
  }, []);

  const factory = (node: TabNode) => {
    const component = node.getComponent();
    
    if (component === 'content') {
      const config = node.getConfig();
      const contentType = config?.contentType || 'default';
      
      return (
        <div 
          data-pane-id={node.getId()} 
          data-widget={contentType}
          className="h-full w-full"
        >
          <DynamicContent node={node} />
        </div>
      );
    }
    
    return <div>Unknown component: {component}</div>;
  };

  const onModelChange = (newModel: Model) => {
    // Handle user-initiated layout changes - FlexLayout is the source of truth
    console.log('👆 User interaction - FlexLayout changed (native handling)');
    
    setModel(newModel);
    modelRef.current = newModel;
    globalModel = newModel; // Update global reference for tools
    
    // Optional: Save to localStorage for persistence
    try {
      localStorage.setItem('flexlayout-model', JSON.stringify(newModel.toJson()));
      console.log('💾 Saved layout to localStorage');
    } catch (error) {
      console.warn('Failed to save layout:', error);
    }
  };

  if (!model) {
    return <div className="flex items-center justify-center h-full">Loading layout...</div>;
  }

  return (
    <ResizeObserverComponent>
      <div className="h-full w-full relative overflow-hidden">
        <div 
          className="h-full w-full"
          style={{
            position: 'relative',
            height: '100%',
            maxHeight: '100%',
            overflow: 'hidden'
          }}
        >
          <Layout
            model={model}
            factory={factory}
            onModelChange={onModelChange}
          />
        </div>
      </div>
    </ResizeObserverComponent>
  );
};

// Export function to get current model for tools
export function getCurrentFlexLayoutModel(): Model | null {
  return globalModel;
}

export default FlexLayoutContainer;
