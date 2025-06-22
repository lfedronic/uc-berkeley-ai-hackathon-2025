/* ────────────────────────────────────────────────
   app/learn/components/LayoutChat.tsx
───────────────────────────────────────────────── */
'use client';

import React, { useState } from 'react';
import { useChat } from 'ai/react';
import {
  addTabToFlexLayout,
  activateTabInFlexLayout,
  closeTabInFlexLayout,
  splitPaneInFlexLayout,
  getEnvironmentFromFlexLayout,
} from '@/lib/agents/flexLayoutTools';
import { getCurrentFlexLayoutModel } from './FlexLayoutContainer';

/* helper for log timestamps */
const stamp = () => new Date().toLocaleTimeString();

const LayoutChat: React.FC = () => {
  const [log, setLog] = useState<string[]>([]);
  const push = (m: string) => setLog((p) => [...p, `${stamp()}: ${m}`]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
  } = useChat({
    api: '/api/layout',
    maxSteps: 5,

    onToolCall: async ({ toolCall }) => {
      console.log('🔧 [client] toolCall received:', toolCall);

      const { toolName, args } = toolCall;
      const model = getCurrentFlexLayoutModel();
      if (!model) {
        console.error('🚫 model is null');
        return { success: false, error: 'MODEL_NULL' };
      }

      let result;

      switch (toolName) {
        case 'getEnv':
          result = getEnvironmentFromFlexLayout(model);
          break;

        case 'addTab': {
          const { paneId, title, contentId, makeActive = false } = args as any;
          result = addTabToFlexLayout(model, paneId, title, contentId, makeActive);
          break;
        }

        case 'activateTab': {
          const { paneId, tabId } = args as any;
          result = activateTabInFlexLayout(model, paneId, tabId);
          break;
        }

        case 'closeTab': {
          const { tabId } = args as any;
          result = closeTabInFlexLayout(model, tabId);
          break;
        }

        case 'splitPane': {
          const { targetId, orientation, ratio = 0.5 } = args as any;
          result = splitPaneInFlexLayout(model, targetId, orientation, ratio);
          break;
        }

        default:
          result = { success: false, error: `Unknown tool ${toolName}` };
      }

      /* ⚠ remove non-cloneable data before returning */
      if ('model' in result) delete (result as any).model;

      push(`${toolName} → ${result.success ? '✅ success' : '❌ error'}`);
      console.log('✅ [client] returning result:', result);
      return result;
    },

    onError: (err) => {
      console.error('❌ useChat onError:', err);
      push(`error: ${err}`);
    },

    onFinish: () => console.log('🟢 useChat turn finished'),
  });

  /* demo prompts */
  const demos = [
    { label: 'Env summary',        prompt: 'Describe the current layout' },
    { label: 'Add “Homework” tab', prompt: 'Add a tab titled Homework with content type quiz to the pane that currently contains Quiz, and make it active.' },
    { label: 'Split diagram pane', prompt: 'Split the pane containing Diagram vertically (row orientation) 50/50.' },
  ];

  const submitDemo = (p: string) => {
    handleInputChange({ target: { value: p } } as any);
    handleSubmit(new Event('submit') as any);
  };

  return (
    <div className="h-full w-full flex flex-col gap-4 p-6">
      {/* demo buttons */}
      <div className="flex gap-2 flex-wrap">
        {demos.map(({ label, prompt }) => (
          <button
            key={label}
            onClick={() => submitDemo(prompt)}
            className="bg-purple-600 text-white rounded px-4 py-2 hover:bg-purple-700"
          >
            {label}
          </button>
        ))}
      </div>

      {/* chat messages */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-lg p-3 ${
              m.role === 'user' ? 'bg-purple-100 ml-12' : 'bg-gray-100 mr-12'
            }`}
          >
            <div className="text-sm text-gray-600 mb-1">
              {m.role === 'user' ? 'User' : 'Assistant'}
            </div>

            {m.content && <div className="whitespace-pre-wrap">{m.content}</div>}

            {m.toolInvocations?.length > 0 && (
              <div className="mt-2 bg-orange-50 p-2 rounded border-l-4 border-orange-400 text-xs">
                {m.toolInvocations.map((inv) => (
                  <div key={inv.toolCallId}>
                    {inv.toolName} {inv.state === 'result' ? '✅' : '⏳'}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          disabled={isLoading}
          placeholder="Ask the layout agent…"
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          disabled={!input.trim() || isLoading}
          className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {isLoading ? '…' : 'Send'}
        </button>
      </form>

      {/* execution log */}
      <div className="bg-gray-100 rounded p-3 text-xs max-h-40 overflow-y-auto">
        {log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
};

export default LayoutChat;
