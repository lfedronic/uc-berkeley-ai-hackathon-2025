/* ------------------------------------------------------------------
 * LayoutChat.tsx  -- chat box that drives the FlexLayout agent
 * ------------------------------------------------------------------
 *
 * 🔹 F1  Transparent labels
 *     • Any tool-call argument that is a string and matches a key in
 *       the current label-map is automatically rewritten to its ID.
 *     • The latest label-map is sent to the server with every request
 *       (via the X-Layout-Labels header) so the LLM never works with
 *       stale IDs.
 *
 * 🔹 F3  Stronger system prompt
 *     • Rewritten from scratch to be concise and prescriptive.
 *     • Sent once per conversation through the X-System-Prompt header.
 * ------------------------------------------------------------------ */
'use client';

import React, { useState, useMemo } from 'react';
import { useChat } from 'ai/react';

import {
  addTabToFlexLayout,
  activateTabInFlexLayout,
  closeTabInFlexLayout,
  splitPaneInFlexLayout,
  getEnvironmentFromFlexLayout,
} from '@/lib/agents/flexLayoutTools';
import { getCurrentFlexLayoutModel } from './FlexLayoutContainer';
import { useLayoutStore } from '@/lib/stores/layoutStore';
import { devLog } from '@/lib/debug/devLogger';

/* -------------------------------------------------- */
/* helpers                                            */
/* -------------------------------------------------- */
const stamp = () => new Date().toLocaleTimeString();

/* -------------------------------------------------- */
/* constant, high-signal system prompt  (F 3)          */
/* -------------------------------------------------- */
const makeSystemPrompt = (labelMap: Record<string, string>) => `
You are the **FlexLayout agent** for our tutoring UI.

TOOLS (always emit valid JSON):
• getEnv          – retrieve current layout + viewport (use when IDs might have changed)
• addTab          – { paneId, title, contentId, makeActive? }
• activateTab     – { paneId, tabId }
• closeTab        – { tabId }
• splitPane       – { targetId, orientation:row|column, ratio? }

RULES (obey strictly):
1. Depth may not exceed 2 (max 4 visual regions).
2. Never invent IDs – use LABEL_MAP below or call getEnv.
3. Finish each turn with ≤2 plain-English sentences for the user.

PLANNING STEPS:
1. Think through the user request.
2. Decide whether you need getEnv first.
3. Emit the minimum tool calls in order.
4. Send the brief summary.

LABEL_MAP: ${JSON.stringify(labelMap)}
`.trim();

/* -------------------------------------------------- */
/* main component                                     */
/* -------------------------------------------------- */
const LayoutChat: React.FC = () => {
  /* 🔸  local message log (simple timestamped strings) */
  const [log, setLog] = useState<string[]>([]);
  const pushLog = (m: string) => setLog((p) => [...p, `${stamp()}: ${m}`]);

  /* 🔸  access live label map + helper to resolve labels → ids */
  const labels       = useLayoutStore((s) => s.labels);
  const resolveLabel = (label: string) => labels[label] || null;

  /* --------------------------------------------------
   * useChat – we supply a *fresh* header object on every
   * render so the label-map is always current (F 1)
   * -------------------------------------------------- */
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
  } = useChat({
    api:  '/api/layout',
    maxSteps: 5,

    /* ✉️  headers are recomputed every render so labels stay fresh */
    headers: useMemo(() => ({
      'X-Layout-Labels' : encodeURIComponent(JSON.stringify(labels)),
      'X-System-Prompt' : encodeURIComponent(makeSystemPrompt(labels)),
    }), [labels]),

    /* 🔎  dev tracing */
    onResponse: (msg) => devLog.push({ t: 'llm', direction: 'res', payload: msg }),

    /* -----------------------------------------------
     * tool-call interceptor   (label → id mapping)
     * --------------------------------------------- */
    onToolCall: async ({ toolCall }) => {
      const { toolName, args } = toolCall;
      const started = performance.now();

      /* map any string arg equal to a label-key → its id */
      const mapArg = (v: any) =>
        typeof v === 'string' && resolveLabel(v) ? resolveLabel(v) : v;
      const mappedArgs: Record<string, any> = Object.fromEntries(
        Object.entries(args as Record<string, any>).map(([k, v]) => [k, mapArg(v)]),
      );

      /* current model reference */
      const model = getCurrentFlexLayoutModel();
      if (!model) {
        const err = { success: false, error: 'MODEL_NULL' };
        devLog.push({ t: 'tool', name: toolName, args: mappedArgs, result: err, ms: Math.round(performance.now() - started) });
        return err;
      }

      /* dispatch to helper fns */
      let result;
      switch (toolName) {
        case 'getEnv':
          result = getEnvironmentFromFlexLayout(model);
          break;
        case 'addTab':
          result = addTabToFlexLayout(
            model,
            mappedArgs.paneId,
            mappedArgs.title,
            mappedArgs.contentId,
            mappedArgs.makeActive ?? false,
          );
          break;
        case 'activateTab':
          result = activateTabInFlexLayout(
            model,
            mappedArgs.paneId,
            mappedArgs.tabId,
          );
          break;
        case 'closeTab':
          result = closeTabInFlexLayout(model, mappedArgs.tabId);
          break;
        case 'splitPane':
          result = splitPaneInFlexLayout(
            model,
            mappedArgs.targetId,
            mappedArgs.orientation,
            mappedArgs.ratio ?? 0.5,
          );
          break;
        default:
          result = { success: false, error: `Unknown tool ${toolName}` };
      }

      devLog.push({
        t: 'tool',
        name: toolName,
        args: mappedArgs,
        result,
        ms: Math.round(performance.now() - started),
      });
      pushLog(`${toolName} → ${result.success ? '✅ success' : '❌ error'}`);
      return result;
    },

    /* error tracer */
    onError: (err) => {
      console.error('❌ useChat onError:', err);
      pushLog(`error: ${err}`);
    },
  });

  /* -------------------------------------------------- */
  /* quick demo buttons                                 */
  /* -------------------------------------------------- */
  const demos = [
    { label: 'Env summary', prompt: 'Describe the current layout.' },
    {
      label: 'Add “Homework”',
      prompt:
        'Add a tab titled Homework (content type quiz) to lectureNotesPane and make it active.',
    },
    {
      label: 'Split lecture 66/34',
      prompt:
        'Split lectureNotesPane vertically (row orientation) 66 / 34.',
    },
  ];

  const submitDemo = (p: string) => {
    handleInputChange({ target: { value: p } } as any);
    handleSubmit(new Event('submit') as any);
  };

  /* -------------------------------------------------- */
  /* UI                                                 */
  /* -------------------------------------------------- */
  return (
    <div className="flex h-full w-full flex-col gap-4 p-6">
      {/* demo buttons */}
      <div className="flex flex-wrap gap-2">
        {demos.map(({ label, prompt }) => (
          <button
            key={label}
            onClick={() => submitDemo(prompt)}
            className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
          >
            {label}
          </button>
        ))}
      </div>

      {/* chat transcript */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-lg p-3 ${
              m.role === 'user' ? 'ml-12 bg-purple-100' : 'mr-12 bg-gray-100'
            }`}
          >
            <div className="mb-1 text-sm text-gray-600">
              {m.role === 'user' ? 'User' : 'Assistant'}
            </div>

            {m.content && <div className="whitespace-pre-wrap">{m.content}</div>}

            {m.toolInvocations?.length > 0 && (
              <div className="mt-2 rounded border-l-4 border-orange-400 bg-orange-50 p-2 text-xs">
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

      {/* input row */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          disabled={isLoading}
          placeholder="Ask the layout agent…"
          className="flex-1 rounded border px-3 py-2"
        />
        <button
          disabled={!input.trim() || isLoading}
          className="rounded bg-purple-600 px-6 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {isLoading ? '…' : 'Send'}
        </button>
      </form>

      {/* local log */}
      <div className="max-h-40 overflow-y-auto rounded bg-gray-100 p-3 text-xs">
        {log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
};

export default LayoutChat;
