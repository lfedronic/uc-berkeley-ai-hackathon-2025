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

/* ---------- starter layout: 2×2 placeholders ---------- */
const initialModel: IJsonModel = {
  global: { tabEnableClose: true, tabEnableRename: false, borderSize: 25 },
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
                id:   'lecture-welcome',
                name: 'Lecture Notes',
                component: 'content',
                config: { contentType: 'lecture', bgColor: 'bg-blue-100' },
              },
            ],
          },
          {
            type: 'tabset',
            weight: 50,
            children: [
              {
                type: 'tab',
                id:   'quiz-welcome',
                name: 'Quiz',
                component: 'content',
                config: { contentType: 'quiz', bgColor: 'bg-green-100' },
              },
            ],
          },
        ],
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
                id:   'diagram-welcome',
                name: 'Diagram',
                component: 'content',
                config: { contentType: 'diagram', bgColor: 'bg-purple-100' },
              },
            ],
          },
          {
            type: 'tabset',
            id:   'main-tabset',          // ← will collect chat-generated tabs
            weight: 50,
            children: [
              {
                type: 'tab',
                id:   'summary-welcome',
                name: 'Summary',
                component: 'content',
                config: { contentType: 'summary', bgColor: 'bg-yellow-100' },
              },
            ],
          },
        ],
      },
    ],
  },
};

/* ---------- content renderer ---------- */
const DynamicContent: React.FC<{ node: TabNode }> = ({ node }) => {
  const { contentType, bgColor, data } = node.getConfig();

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
  }

  /* placeholder fallback */
  const text: Record<string, string> = {
    lecture:
      'Lecture Notes Content\n\nThis pane would contain lecture slides, PDFs, or educational content.',
    quiz:
      'Quiz Content\n\nUse the chat to generate a quiz and it will appear here.',
    diagram:
      'Diagram Content\n\nThis pane would contain visual diagrams, charts, and illustrations.',
    summary:
      'Summary Content\n\nUse the chat to generate a summary and it will appear here.',
    welcome:
      'Welcome to the AI Learning Platform!\n\nUse the chat popup to generate:\n• Concept summaries and lesson plans\n• Interactive quizzes\n\nEach item appears as a draggable tab.',
  };

  return (
    <div className={`h-full w-full flex flex-col p-4 ${bgColor ?? 'bg-gray-100'}`}>
      <h2 className="mb-4 text-lg font-semibold text-gray-800">{node.getName()}</h2>
      <div className="flex-1 whitespace-pre-line text-gray-700">
        {text[contentType] ?? 'Placeholder'}
      </div>
      <div className="mt-4 text-xs text-gray-500">
        Tab&nbsp;ID: {node.getId()} | Type: {contentType ?? 'default'}
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
