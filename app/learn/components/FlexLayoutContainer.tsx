'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Layout, Model, TabNode, IJsonModel } from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import { useLayoutStore } from '@/lib/stores/layoutStore';    // unchanged path
import { buildLabelMap } from '@/lib/stores/layoutStore';


/* ---------- initial grid ---------- */
const initialModel: IJsonModel = {
  global: { tabEnableClose: true, tabEnableRename: false, borderSize: 25 },
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
                name: 'Diagram',
                component: 'content',
                config: { contentType: 'diagram', bgColor: 'bg-purple-100' },
              },
            ],
          },
          {
            type: 'tabset',
            weight: 50,
            children: [
              {
                type: 'tab',
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

/* ---------- helper: slug → camelCase ---------- */
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/ (.)/g, (_, c) => c.toUpperCase());

/* ---------- placeholder renderer ---------- */
const PlaceholderContent: React.FC<{ node: TabNode }> = ({ node }) => {
  const { contentType, bgColor } = node.getConfig();
  const text: Record<string, string> = {
    lecture:
      'Lecture Notes Content\n\nThis pane would contain lecture slides, PDFs, or educational content.',
    quiz: 'Quiz Content\n\nThis pane would contain interactive quizzes and assessments.',
    diagram:
      'Diagram Content\n\nThis pane would contain visual diagrams, charts, and illustrations.',
    summary:
      'Summary Content\n\nThis pane would contain AI-generated summaries and key points.',
  };
  return (
    <div className={`h-full w-full p-4 ${bgColor ?? 'bg-gray-100'} flex flex-col`}>
      <h2 className="text-lg font-semibold mb-4 text-gray-800">{node.getName()}</h2>
      <div className="flex-1 whitespace-pre-line text-gray-700">
        {text[contentType] ?? 'Default Content\n\nPlaceholder for this pane.'}
      </div>
      <div className="mt-4 text-xs text-gray-500">
        Pane&nbsp;ID: {node.getId()} | Type: {contentType ?? 'default'}
      </div>
    </div>
  );
};

/* ---------- component ---------- */
let globalModel: Model | null = null;


const FlexLayoutContainer: React.FC = () => {
  const [model, setModel] = useState<Model | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { updateEnv, setLayoutJson } = useLayoutStore(); // 🆕 simpler selector

  useEffect(() => {
    const m = Model.fromJson(initialModel);
    setModel(m);
    globalModel = m;
    refreshLabelsAndJson(m);
  }, []);

  /* refresh labels + JSON on every change */
  const refreshLabelsAndJson = (m: Model) => {
    /* delegates label-building to the store (F3) */
    const json = m.toJson();
    const labels = (json.layout ? buildLabelMap(json.layout) : {}) as Record<
      string,
      string
    >;
    setLayoutJson(json, labels);
  };

  const onModelChange = (m: Model) => { setModel(m); globalModel = m; refreshLabelsAndJson(m); };

  /* publish env via ResizeObserver */
  useEffect(() => {
    if (!ref.current || !model) return;
    const ro = new ResizeObserver(pub);
    ro.observe(ref.current); pub();
    return () => ro.disconnect();

    function pub() {
      const { width, height } = ref.current!.getBoundingClientRect();
      const panes = Array.from(ref.current!.querySelectorAll<HTMLElement>('[data-pane-id]')).map((el) => {
        const r = el.getBoundingClientRect();
        return { id: el.dataset.paneId!, widget: el.dataset.widget!, box: { w: Math.round(r.width), h: Math.round(r.height) }, minW: 320, minH: 240 };
      });
      updateEnv({ viewport: { w: Math.round(width), h: Math.round(height), dpr: window.devicePixelRatio || 1 }, panes });
    }
  }, [model, updateEnv]);

  if (!model) return <div className="flex h-full items-center justify-center">Loading…</div>;

  const factory = (n: TabNode) =>
    n.getComponent() === 'content' ? (
      <div data-pane-id={n.getId()} data-widget={n.getConfig()?.contentType} className="h-full w-full">
        <PlaceholderContent node={n} />
      </div>
    ) : (
      <div>Unknown component {n.getComponent()}</div>
    );

  return <div ref={ref} className="h-full w-full overflow-hidden"><Layout model={model} factory={factory} onModelChange={onModelChange} /></div>;
};

export function getCurrentFlexLayoutModel() { return globalModel; }
export default FlexLayoutContainer;
