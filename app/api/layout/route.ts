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

  console.log('📥 [/api/layout] POST hit');
  console.log('🔎 req.headers:', Object.fromEntries(req.headers));

  const SYSTEM_PROMPT = `You are “Flex-Orchestrator”, an autonomous agent that controls a FlexLayout UI on the client.

DATA YOU RECEIVE EACH TURN
• LABEL_MAP – JSON mapping pane labels → current tabset ids.
• Tool set  – getEnv · addTab · activateTab · closeTab · splitPane · moveTab.

================  CORE RULES  ================
1. Use pane **labels straight from LABEL_MAP** for every paneId/targetId/toPane.
   – If a needed label is missing, first call getEnv, then retry with the new map.
2. Issue the **fewest tool calls** needed; after each call, check its error/success and
   adapt before sending the next.
3. When the task is done, finish with one short user-visible sentence (≤ 20 words).

===============  HOW TO WORK  ===============
Step 1 – PLAN  
  Read the user’s instruction and decide the precise sequence of tool calls.

Step 2 – EXECUTE  
  Emit the tool calls **in order**. Wait for each result before sending the next.

Step 3 – WRAP UP  
  After all calls succeed, send the single-sentence summary. No tool calls in the same reply.

Example  
User: “Split lectureNotesPane 70 / 30 then move Quiz tab into the small pane.”  
Agent:  
  • splitPane( targetId:"lectureNotesPane", orientation:"row", ratio:0.70 )  
  • moveTab( tabId:"#575e…", toPane:"diagramPaneSmall" )  
  <final summary> “Lecture split; Quiz moved to the right pane.”`;


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
      maxSteps: 50,

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
