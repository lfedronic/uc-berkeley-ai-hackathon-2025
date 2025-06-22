/* ──────────────────────────────────────────────────
   app/api/layout/route.ts
   — Edge-/server route that streams the agent response
─────────────────────────────────────────────────── */
import { openai }    from '@ai-sdk/openai';
import { streamText } from 'ai';
import {
  addTabTool,
  activateTabTool,
  closeTabTool,
  splitPaneTool,
  getEnvTool,
} from '@/lib/agents/flexLayoutClientTools';

export async function POST(req: Request) {
  const SYSTEM_PROMPT =
    'You are a FlexLayout agent. All tools execute on the client; you only call them. Always finish with a brief user-visible summary.';

  console.log('📥 [/api/layout] POST hit');
  console.log('🔎 req.headers:', Object.fromEntries(req.headers));

  try {
    const body     = await req.json();
    const { messages } = body ?? {};

    console.log('🔎 raw body:', JSON.stringify(body, null, 2));

    if (!Array.isArray(messages)) {
      console.error('🚫 messages invalid:', messages);
      return Response.json({ error: 'Messages array required' }, { status: 400 });
    }

    /* ---- register client-side tools ---- */
    const tools = {
      addTab:     addTabTool,
      activateTab: activateTabTool,
      closeTab:   closeTabTool,
      splitPane:  splitPaneTool,
      getEnv:     getEnvTool,
    };

    messages.slice(-5).forEach((m, i) =>
      console.log(`🔎 msg[-${5 - i}]`, {
        role: m.role,
        contentPreview: String(m.content).slice(0, 60),
        toolInv: m.toolInvocations?.length ?? 0,
      }),
    );

    /* ---- stream to OpenAI ---- */
    const result = await streamText({
      model: openai('gpt-4o-mini'),      // <-- pick an existing model
      system: SYSTEM_PROMPT,
      tools,
      messages,
      maxSteps: 10,

      onStepFinish({
        stepType, text, toolCalls, toolResults, finishReason, usage,
      }) {
        console.log(
          `🟢 step finished – ${stepType}, reason=${finishReason}`,
          { textLen: text?.length ?? 0, toolCalls, toolResults, usage },
        );
      },

      onError(error) {
        console.error('💥 streamText error:', error);
      },
    });

    /* detach long-running debug logging so we don’t block the response */
    result.steps
      .then((steps) => {
        console.log('✅ stream completed – total steps:', steps.length);
        console.dir(steps, { depth: 4 });
      })
      .catch((err) => console.error('💥 step logging error:', err));

    /* 🚀 return the **streaming** response right away */
    return result.toDataStreamResponse();
  } catch (err) {
    console.error('💥 /api/layout fatal error:', err);
    return Response.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
