'use client';

import React, { useEffect, useRef } from 'react';
import { Layout, Model, TabNode, IJsonModel, Actions, DockLocation } from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import ResizeObserverComponent from './ResizeObserver';

// Initial layout configuration - starts with a welcome tab, more tabs added dynamically via chat
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
        children: [
          {
            type: 'tab',
            id: 'welcome-tab',
            name: 'Welcome',
            component: 'content',
            config: { 
              contentType: 'welcome',
              bgColor: 'bg-blue-50'
            }
          }
        ]
      }
    ]
  }
};

import Summary from '@/components/Summary';
import Quiz from '@/components/Quiz';
import Diagram from '@/components/Diagram';
import Webpage from '@/components/Webpage';
import VoiceChatAgent from '@/components/VoiceChatAgent';
import { GeneratedQuiz } from '@/lib/agents/quizAgent';
import { GeneratedDiagram } from '@/lib/agents/diagramAgent';
import { GeneratedWebpage } from '@/lib/agents/webpageAgent';

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
      
    case 'diagram':
      if (data?.diagram) {
        return (
          <Diagram
            diagram={data.diagram}
          />
        );
      }
      break;
      
    case 'webpage':
      if (data?.webpage) {
        return (
          <Webpage
            webpage={data.webpage}
          />
        );
      }
      break;
  }
  
  // Fallback placeholder content
  const bgColor = config?.bgColor || 'bg-gray-100';
  
  const getPlaceholderText = (type: string) => {
    switch (type) {
      case 'welcome':
        return 'Welcome to the AI Learning Platform!\n\nUse the chat popup in the bottom-right corner to generate:\n\n• Concept summaries and lesson plans\n• Interactive quizzes and assessments\n• Visual diagrams and flowcharts\n• Interactive demos and simulations\n• Python visualizations and charts\n• Custom educational webpages\n• Course overviews and curricula\n\nEach piece of content will appear as a new draggable tab that you can arrange however you like.\n\nTry asking for: "Create an interactive demo of sorting algorithms" or "Build a physics simulation for projectile motion"!';
      case 'lecture':
        return 'Lecture Notes Content\n\nThis pane would contain lecture slides, PDFs, or educational content.';
      case 'quiz':
        return 'Quiz Content\n\nUse the chat to generate a quiz and it will appear here.';
      case 'diagram':
        return 'Diagram Content\n\nUse the chat to generate a visual diagram and it will appear here.';
      case 'summary':
        return 'Summary Content\n\nUse the chat to generate a summary and it will appear here.';
      case 'webpage':
        return 'Interactive Content\n\nUse the chat to generate custom webpages, simulations, or Python visualizations and they will appear here.';
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

  // Handler for when summary content is generated (same logic as test-chat)
  const handleLessonUpdate = (content: string) => {
    console.log('🔥 handleLessonUpdate called with content length:', content.length);
    console.log('🔥 Model available:', !!model);
    
    if (!model) {
      console.error('❌ No model available for adding tab');
      return;
    }
    
    console.log('📝 Creating summary tab with content:', content.substring(0, 100) + '...');
    
    // Extract title from content (first line or first heading)
    const lines = content.split('\n');
    const titleLine = lines.find(line => line.trim().startsWith('#')) || lines[0];
    const title = titleLine?.replace(/^#+\s*/, '').trim() || 'Summary';
    
    console.log('📝 Extracted title:', title);
    
    // Create a unique tab ID
    const tabId = `tab-${Date.now()}`;
    
    try {
      // Add a new tab with the summary content using FlexLayout Actions
      const action = Actions.addNode(
        {
          type: 'tab',
          id: tabId,
          name: title,
          component: 'content',
          config: {
            contentType: 'summary',
            data: {
              content,
              title,
              topic: title,
              type: 'summary'
            }
          }
        },
        'main-tabset',
        DockLocation.CENTER,
        -1, // Add to the end (rightmost position)
        true // make active
      );
      
      console.log('📝 Created action:', action);
      model.doAction(action);
      console.log(`✅ Added summary tab: ${title}`);
    } catch (error) {
      console.error('❌ Error adding summary tab:', error);
    }
  };

  // Handler for when quiz content is generated (same logic as test-chat)
  const handleQuizUpdate = (quiz: GeneratedQuiz) => {
    console.log('🔥 handleQuizUpdate called with quiz:', quiz.title);
    console.log('🔥 Model available:', !!model);
    
    if (!model) {
      console.error('❌ No model available for adding quiz tab');
      return;
    }
    
    console.log('🧠 Creating quiz tab:', quiz.title);
    
    // Create a unique tab ID
    const tabId = `tab-${Date.now()}`;
    
    try {
      // Add a new tab with the quiz content using FlexLayout Actions
      const action = Actions.addNode(
        {
          type: 'tab',
          id: tabId,
          name: quiz.title,
          component: 'content',
          config: {
            contentType: 'quiz',
            data: {
              quiz
            }
          }
        },
        'main-tabset',
        DockLocation.CENTER,
        -1, // Add to the end (rightmost position)
        true // make active
      );
      
      console.log('🧠 Created action:', action);
      model.doAction(action);
      console.log(`✅ Added quiz tab: ${quiz.title}`);
    } catch (error) {
      console.error('❌ Error adding quiz tab:', error);
    }
  };

  // Handler for when webpage content is generated
  const handleWebpageUpdate = (webpage: GeneratedWebpage) => {
    console.log('🔥 handleWebpageUpdate called with webpage:', webpage.title);
    console.log('🔥 Model available:', !!model);
    
    if (!model) {
      console.error('❌ No model available for adding webpage tab');
      return;
    }
    
    console.log('🌐 Creating webpage tab:', webpage.title);
    
    // Create a unique tab ID
    const tabId = `tab-${Date.now()}`;
    
    try {
      // Add a new tab with the webpage content using FlexLayout Actions
      const action = Actions.addNode(
        {
          type: 'tab',
          id: tabId,
          name: webpage.title,
          component: 'content',
          config: {
            contentType: 'webpage',
            data: {
              webpage
            }
          }
        },
        'main-tabset',
        DockLocation.CENTER,
        -1, // Add to the end (rightmost position)
        true // make active
      );
      
      console.log('🌐 Created action:', action);
      model.doAction(action);
      console.log(`✅ Added webpage tab: ${webpage.title}`);
    } catch (error) {
      console.error('❌ Error adding webpage tab:', error);
    }
  };

  // Handler for when diagram content is generated
  const handleDiagramUpdate = (diagram: GeneratedDiagram) => {
    console.log('🔥 handleDiagramUpdate called with diagram:', diagram.title);
    console.log('🔥 Model available:', !!model);
    
    if (!model) {
      console.error('❌ No model available for adding diagram tab');
      return;
    }
    
    console.log('📊 Creating diagram tab:', diagram.title);
    
    // Create a unique tab ID
    const tabId = `tab-${Date.now()}`;
    
    try {
      // Add a new tab with the diagram content using FlexLayout Actions
      const action = Actions.addNode(
        {
          type: 'tab',
          id: tabId,
          name: diagram.title,
          component: 'content',
          config: {
            contentType: 'diagram',
            data: {
              diagram
            }
          }
        },
        'main-tabset',
        DockLocation.CENTER,
        -1, // Add to the end (rightmost position)
        true // make active
      );
      
      console.log('📊 Created action:', action);
      model.doAction(action);
      console.log(`✅ Added diagram tab: ${diagram.title}`);
    } catch (error) {
      console.error('❌ Error adding diagram tab:', error);
    }
  };

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
        
        {/* Voice Chat Agent for generating content - replaces text chat with voice */}
        <VoiceChatAgent 
          onLessonUpdate={handleLessonUpdate}
          onQuizUpdate={handleQuizUpdate}
          onDiagramUpdate={handleDiagramUpdate}
          onWebpageUpdate={handleWebpageUpdate}
        />
      </div>
    </ResizeObserverComponent>
  );
};

// Export function to get current model for tools
export function getCurrentFlexLayoutModel(): Model | null {
  return globalModel;
}

export default FlexLayoutContainer;
