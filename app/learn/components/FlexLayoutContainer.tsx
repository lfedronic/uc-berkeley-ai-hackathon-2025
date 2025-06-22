'use client';

import React, { useEffect, useRef } from 'react';
import { Layout, Model, TabNode } from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import ResizeObserverComponent from './ResizeObserver';
import { useLayoutStore, layoutNodeToFlexLayout, flexLayoutToLayoutNode } from '@/lib/agents/layoutAgent';

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
  const { layout, updateLayout } = useLayoutStore();
  const isUpdatingFromZustand = useRef(false);

  // Initialize FlexLayout model from Zustand store
  useEffect(() => {
    const flexLayoutModel = layoutNodeToFlexLayout(layout);
    const newModel = Model.fromJson(flexLayoutModel);
    setModel(newModel);
  }, []);

  // Sync Zustand changes to FlexLayout (Zustand → FlexLayout)
  useEffect(() => {
    if (!model) return;
    
    const unsubscribe = useLayoutStore.subscribe((state) => {
      if (isUpdatingFromZustand.current) return; // Prevent sync loops
      
      console.log('Zustand layout changed, updating FlexLayout:', state.layout);
      const flexLayoutModel = layoutNodeToFlexLayout(state.layout);
      const newModel = Model.fromJson(flexLayoutModel);
      
      isUpdatingFromZustand.current = true;
      setModel(newModel);
      setTimeout(() => {
        isUpdatingFromZustand.current = false;
      }, 0);
    });

    return unsubscribe;
  }, [model]);

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
    if (isUpdatingFromZustand.current) return; // Prevent sync loops
    
    // Handle user-initiated layout changes and sync with Zustand store (FlexLayout → Zustand)
    console.log('FlexLayout changed by user, updating Zustand:', newModel.toJson());
    setModel(newModel);
    
    try {
      const layoutNode = flexLayoutToLayoutNode(newModel.toJson());
      updateLayout(layoutNode);
    } catch (error) {
      console.error('Error converting FlexLayout to LayoutNode:', error);
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

export default FlexLayoutContainer;
