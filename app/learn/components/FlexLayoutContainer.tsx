/* ──────────────────────────────────────────────────────────────────
   app/learn/components/FlexLayoutContainer.tsx
   – merged dynamic-UI + real-content version
─────────────────────────────────────────────────────────────────── */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Layout, Model, TabNode, IJsonModel, Actions, DockLocation } from 'flexlayout-react';
import 'flexlayout-react/style/light.css';

import { useLayoutStore, buildLabelMap } from '@/lib/stores/layoutStore';
import Summary    from '@/components/Summary';
import Quiz       from '@/components/Quiz';
import ChatPopup  from '@/components/ChatPopup';
import { GeneratedQuiz } from '@/lib/agents/quizAgent';

/* ---------- simplified starter layout: single welcome tab ---------- */
const initialModel: IJsonModel = {
  global: { tabEnableClose: true, tabEnableRename: false, borderSize: 25 },
  layout: {
    type: 'row',
    weight: 100,
    children: [
      {
        type: 'tabset',
        id: 'main-tabset',
        weight: 100,
        children: [
          {
            type: 'tab',
            id: 'welcome-tab',
            name: 'Welcome',
            component: 'content',
            config: { 
              contentType: 'welcome',
              bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-100',
              data: {
                title: 'Welcome to AI Learning Platform',
                content: `# 🎓 Welcome to Your AI Learning Environment!
g
📚 Create Content
• “Lesson plan on photosynthesis”
• “Quiz on JavaScript”
• “Diagram of the water cycle”
• “Pendulum simulation”

🎨 Manage Layout
• “Split screen vertically”
• “Move quiz to right pane”
• “New tab for notes”
• “Optimize for studying”

🚀 Combine Tasks
• “Quiz on photosynthesis next to notes”
• “Neural network diagram in new tab”
• “Algebra lesson + study layout”

🤖 Smart & Adaptive
The AI automatically structures content, arranges layouts, and provides visual feedback.

Click the chat to begin..`,
                customStyles: {
                  container: 'p-8 max-w-4xl mx-auto',
                  title: 'text-3xl font-bold text-gray-800 mb-6 text-center',
                  content: 'prose prose-lg max-w-none text-gray-700'
                }
              }
            },
          },
        ],
      },
    ],
  },
};

/* ---------- abstract content renderer ---------- */
const DynamicContent: React.FC<{ node: TabNode }> = ({ node }) => {
  const { contentType, bgColor, data, customHTML } = node.getConfig();

  // Handle specific component types that need special rendering
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
            onComplete={(score, total) =>
              console.log(`Quiz finished → ${score}/${total}`)
            }
          />
        );
      }
      break;

    case 'welcome':
      if (data?.content && data?.title) {
        const styles = data.customStyles || {};
        return (
          <div className={`h-full w-full overflow-auto ${bgColor ?? 'bg-gray-100'}`}>
            <div className={styles.container || 'p-8 max-w-4xl mx-auto'}>
              <h1 className={styles.title || 'text-3xl font-bold text-gray-800 mb-6 text-center'}>
                {data.title}
              </h1>
              <div 
                className={styles.content || 'prose prose-lg max-w-none text-gray-700'}
                dangerouslySetInnerHTML={{ 
                  __html: data.content.replace(/\n/g, '<br/>').replace(/### /g, '<h3>').replace(/## /g, '<h2>').replace(/# /g, '<h1>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/- /g, '• ') 
                }}
              />
            </div>
          </div>
        );
      }
      break;
  }

  // Handle custom HTML content (for chat agent to inject any HTML)
  if (customHTML) {
    return (
      <div className={`h-full w-full overflow-auto ${bgColor ?? 'bg-gray-100'}`}>
        <div dangerouslySetInnerHTML={{ __html: customHTML }} />
      </div>
    );
  }

  // Handle custom component data (flexible structure for chat agent)
  if (data?.content || data?.html) {
    const styles = data.customStyles || {};
    const containerClass = styles.container || 'p-6';
    const titleClass = styles.title || 'text-xl font-semibold text-gray-800 mb-4';
    const contentClass = styles.content || 'text-gray-700';

    return (
      <div className={`h-full w-full overflow-auto ${bgColor ?? 'bg-gray-100'}`}>
        <div className={containerClass}>
          {data.title && (
            <h2 className={titleClass}>{data.title}</h2>
          )}
          {data.html ? (
            <div 
              className={contentClass}
              dangerouslySetInnerHTML={{ __html: data.html }} 
            />
          ) : (
            <div className={`${contentClass} whitespace-pre-wrap`}>
              {data.content}
            </div>
          )}
          {data.metadata && (
            <div className="mt-4 text-xs text-gray-500 border-t pt-2">
              {Object.entries(data.metadata).map(([key, value]) => (
                <div key={key}>{key}: {String(value)}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback for empty or unknown content
  return (
    <div className={`h-full w-full flex flex-col items-center justify-center p-8 ${bgColor ?? 'bg-gray-100'}`}>
      <div className="text-center text-gray-500">
        <h2 className="text-lg font-medium mb-2">{node.getName()}</h2>
        <p className="text-sm">This tab is ready for content.</p>
        <p className="text-xs mt-2 opacity-75">Use the chat to generate content for this tab.</p>
      </div>
    </div>
  );
};

/* ---------- component ---------- */
let globalModel: Model | null = null;

const FlexLayoutContainer: React.FC = () => {
  const [model, setModel] = useState<Model | null>(null);
  const shellRef          = useRef<HTMLDivElement>(null);

  const { updateEnv, setLayoutJson } = useLayoutStore();

  /* initialise model */
  useEffect(() => {
    const m = Model.fromJson(initialModel);
    setModel(m);
    globalModel = m;
    commit(m);
  }, []);

  /* helper: keep store in-sync */
  const commit = (m: Model) => {
    const json   = m.toJson();
    const labels = buildLabelMap(json.layout);
    setLayoutJson(json, labels);
  };

  /* publish environment */
  useEffect(() => {
    if (!shellRef.current || !model) return;
    const ro = new ResizeObserver(report);
    ro.observe(shellRef.current);
    report();
    return () => ro.disconnect();

    function report() {
      const { width, height } = shellRef.current!.getBoundingClientRect();
      const panes = Array.from(
        shellRef.current!.querySelectorAll<HTMLElement>('[data-pane-id]'),
      ).map((el) => {
        const r = el.getBoundingClientRect();
        return {
          id: el.dataset.paneId!,
          widget: el.dataset.widget!,
          box: { w: Math.round(r.width), h: Math.round(r.height) },
          minW: 320,
          minH: 240,
        };
      });
      updateEnv({
        viewport: { w: Math.round(width), h: Math.round(height), dpr: window.devicePixelRatio || 1 },
        panes,
      });
    }
  }, [model, updateEnv]);

  /* ------------------------------------------------------------------ */
  /*  Chat → create SUMMARY tab                                         */
  /* ------------------------------------------------------------------ */
  const handleLessonUpdate = (markdown: string) => {
    if (!model) return;
    /* pull first heading / line as title */
    const title =
      markdown.split('\n').find((l) => l.trim().match(/^#+\s/))?.replace(/^#+\s*/, '').trim() ??
      'Summary';

    const tabId = `tab-${Date.now()}`;
    model.doAction(
      Actions.addNode(
        {
          type: 'tab',
          id:   tabId,
          name: title,
          component: 'content',
          config: {
            contentType: 'summary',
            data: { content: markdown, title, topic: title, type: 'summary' },
          },
        },
        'main-tabset',
        DockLocation.CENTER,
        -1,
        true,
      ),
    );
    commit(model);
  };

  /* ------------------------------------------------------------------ */
  /*  Chat → create QUIZ tab                                            */
  /* ------------------------------------------------------------------ */
  const handleQuizUpdate = (quiz: GeneratedQuiz) => {
    if (!model) return;
    const tabId = `tab-${Date.now()}`;
    model.doAction(
      Actions.addNode(
        {
          type: 'tab',
          id:   tabId,
          name: quiz.title,
          component: 'content',
          config: {
            contentType: 'quiz',
            data: { quiz },
          },
        },
        'main-tabset',
        DockLocation.CENTER,
        -1,
        true,
      ),
    );
    commit(model);
  };

  /* ------------------------------------------------------------------ */
  /*  flexlayout factory + change hook                                  */
  /* ------------------------------------------------------------------ */
  const factory = (n: TabNode) => (
    <div
      data-pane-id={n.getId()}
      data-widget={n.getConfig()?.contentType}
      className="h-full w-full"
    >
      <DynamicContent node={n} />
    </div>
  );

  const onModelChange = (m: Model) => {
    setModel(m);
    globalModel = m;
    commit(m);
  };

  if (!model) {
    return <div className="flex h-full items-center justify-center">Loading…</div>;
  }

  return (
    <div ref={shellRef} className="h-full w-full overflow-hidden relative">
      <Layout model={model} factory={factory} onModelChange={onModelChange} />

      {/* floating chat popup that feeds back into the layout */}
      <ChatPopup onLessonUpdate={handleLessonUpdate} onQuizUpdate={handleQuizUpdate} />
    </div>
  );
};

/* exported for tools / LayoutChat */
export function getCurrentFlexLayoutModel() {
  return globalModel;
}

export default FlexLayoutContainer;
