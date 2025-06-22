'use client';

import React, { useEffect } from 'react';
import { Layout, Model, TabNode, IJsonModel } from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import ResizeObserverComponent from './ResizeObserver';

// Initial layout configuration - hard-coded 2x2 grid as per M-0 milestone
const initialModel: IJsonModel = {
  global: {
    tabEnableClose: true,
    tabEnableRename: false,
    borderSize: 25,
  },
  borders: [],
  layout: {
    type: 'row',
    weight: 100,
    children: [
      {
        type: 'column',
        weight: 50,
        children: [
          {
            type: 'tabset',
            weight: 50,
            children: [
              {
                type: 'tab',
                name: 'Lecture Notes',
                component: 'content',
                config: { contentType: 'lecture', bgColor: 'bg-blue-100' }
              }
            ]
          },
          {
            type: 'tabset',
            weight: 50,
            children: [
              {
                type: 'tab',
                name: 'Quiz',
                component: 'content',
                config: { contentType: 'quiz', bgColor: 'bg-green-100' }
              }
            ]
          }
        ]
      },
      {
        type: 'column',
        weight: 50,
        children: [
          {
            type: 'tabset',
            weight: 50,
            children: [
              {
                type: 'tab',
                name: 'Diagram',
                component: 'content',
                config: { contentType: 'diagram', bgColor: 'bg-purple-100' }
              }
            ]
          },
          {
            type: 'tabset',
            weight: 50,
            children: [
              {
                type: 'tab',
                name: 'Summary',
                component: 'content',
                config: { contentType: 'summary', bgColor: 'bg-yellow-100' }
              }
            ]
          }
        ]
      }
    ]
  }
};

// Placeholder content component
const PlaceholderContent: React.FC<{ node: TabNode }> = ({ node }) => {
  const config = node.getConfig();
  const contentType = config?.contentType || 'default';
  const bgColor = config?.bgColor || 'bg-gray-100';
  
  const getContentText = (type: string) => {
    switch (type) {
      case 'lecture':
        return 'Lecture Notes Content\n\nThis pane would contain lecture slides, PDFs, or educational content.';
      case 'quiz':
        return 'Quiz Content\n\nThis pane would contain interactive quizzes and assessments.';
      case 'diagram':
        return 'Diagram Content\n\nThis pane would contain visual diagrams, charts, and illustrations.';
      case 'summary':
        return 'Summary Content\n\nThis pane would contain AI-generated summaries and key points.';
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
        {getContentText(contentType)}
      </div>
      <div className="mt-4 text-xs text-gray-500">
        Pane ID: {node.getId()} | Type: {contentType}
      </div>
    </div>
  );
};

const FlexLayoutContainer: React.FC = () => {
  const [model, setModel] = React.useState<Model | null>(null);

  useEffect(() => {
    // Initialize the FlexLayout model from Zustand store
    const newModel = Model.fromJson(initialModel);
    setModel(newModel);
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
          <PlaceholderContent node={node} />
        </div>
      );
    }
    
    return <div>Unknown component: {component}</div>;
  };

  const onModelChange = (newModel: Model) => {
    // Handle user-initiated layout changes and sync with Zustand store
    console.log('Layout changed:', newModel.toJson());
    setModel(newModel);
    
    // TODO: Convert FlexLayout model to our LayoutNode format and update store
    // This will be implemented in Phase 5 (M-4)
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

export default FlexLayoutContainer;
