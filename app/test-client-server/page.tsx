'use client';

import React, { useState } from 'react';
import { useChat } from 'ai/react';

/* -----------------------------------------------------------
 *  Helper to pretty-print timestamps
 * ----------------------------------------------------------*/
const stamp = () => new Date().toLocaleTimeString();

export default function TestClientServerPage() {
  const [log, setLog] = useState<string[]>([]);
  const push = (msg: string) => setLog((p) => [...p, `${stamp()}: ${msg}`]);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/test-client-server',
    /* 🔑 allow follow-up round-trips after tool results arrive */
    maxSteps: 5,

    /* ------------------ CLIENT TOOL EXECUTION ------------------ */
    onToolCall: async ({ toolCall }) => {
      push(`Tool call: ${toolCall.toolName}`);

      let result: any;
      try {
        switch (toolCall.toolName) {
          case 'clientStepOne': {
            const { message } = toolCall.args as any;
            result = {
              step: 1,
              processed: `Step-1 → ${message}`,
              nextData: `step1-${Date.now()}`,
            };
            break;
          }

          case 'clientStepTwo': {
            const { previousData, action } = toolCall.args as any;
            result = {
              step: 2,
              previousData,
              action,
              nextData: `step2-${Date.now()}`,
            };
            break;
          }

          case 'clientStepThree': {
            const { previousData, finalAction } = toolCall.args as any;
            result = {
              step: 3,
              previousData,
              finalAction,
              done: true,
            };
            break;
          }

          case 'clientSimpleLog': {
            const { message, level } = toolCall.args as any;
            console[level === 'error' ? 'error' : 'log'](`📋 [${level}] ${message}`);
            result = { logged: true };
            break;
          }

          default:
            result = { error: `Unknown tool ${toolCall.toolName}` };
        }
      } finally {
        /* -------------- IMPORTANT --------------
         * Return the RAW object – no JSON.stringify
         * --------------------------------------*/
        return result;
      }
    },

    onError: (e) => push(`❌ error: ${e}`),
    onFinish: () => push('Assistant finished turn.'),
  });

  /* -------------------------- UI --------------------------- */
  const canned = [
    {
      name: 'Log',
      prompt: "Log a success message saying 'client side works!'",
    },
    {
      name: '2-step',
      prompt:
        "Execute a two-step process: first process the message 'Hello', then perform action 'validate'.",
    },
    {
      name: '3-step',
      prompt:
        "Execute a complete three-step process: start with message 'Data', then action 'transform', then final action 'save'.",
    },
  ];

  const run = (p: string) => {
    const evt = new Event('submit') as any;
    handleInputChange({ target: { value: p } } as any);
    handleSubmit(evt);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Client ⇄ Server Tool-Calling Test</h1>

      {/* Quick buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {canned.map(({ name, prompt }) => (
          <button
            key={name}
            onClick={() => run(prompt)}
            disabled={isLoading}
            className="bg-purple-600 text-white rounded-lg p-4 hover:bg-purple-700 disabled:opacity-50"
          >
            {name}
          </button>
        ))}
      </div>

      {/* Manual input */}
      <form onSubmit={handleSubmit} className="flex gap-4 mb-8">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          disabled={isLoading}
          placeholder="Enter a test command..."
          className="flex-1 border p-2 rounded-lg"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {isLoading ? 'Running…' : 'Send'}
        </button>
      </form>

      {/* Chat transcript */}
      <div className="space-y-4 mb-8">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-lg p-4 ${
              m.role === 'user' ? 'bg-purple-100 ml-8' : 'bg-gray-100 mr-8'
            }`}
          >
            <strong className="block text-sm text-gray-600 mb-1">
              {m.role === 'user' ? 'User' : 'Assistant'}
            </strong>

            {/* show text if any */}
            {m.content && <div className="whitespace-pre-wrap">{m.content}</div>}

            {/* show tool invocations (parts) */}
            {m.toolInvocations?.length > 0 && (
              <div className="mt-2 bg-orange-50 p-3 rounded border-l-4 border-orange-400 text-sm">
                {m.toolInvocations.map((inv) => (
                  <div key={inv.toolCallId}>
                    <code className="font-mono">{inv.toolName}</code>{' '}
                    {inv.state === 'result' ? '✅' : '⏳'}{' '}
                    <span className="break-all">{JSON.stringify(inv.args)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Execution log */}
      <h2 className="text-xl font-semibold mb-2">Client Execution Log</h2>
      <div className="bg-gray-100 p-4 rounded max-h-60 overflow-y-auto text-sm font-mono">
        {log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}
