import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import {
  clientStepOneTool,
  clientStepTwoTool,
  clientStepThreeTool,
  clientSimpleLogTool,
} from '@/lib/agents/clientTestTools';

export async function POST(req: Request) {
  console.log('🔄 TEST CLIENT-SERVER API Route Hit');

  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages)) {
      return Response.json({ error: 'Messages array is required' }, { status: 400 });
    }

    /* ----------------------------------
     *  FORWARD ALL MESSAGES UNTOUCHED
     *  ---------------------------------*/
    const tools = {
      clientStepOne: clientStepOneTool,
      clientStepTwo: clientStepTwoTool,
      clientStepThree: clientStepThreeTool,
      clientSimpleLog: clientSimpleLogTool,
    };

    const result = await streamText({
      model: openai('o3-mini'),
      tools,
      maxSteps: 10,
      system: `
You are a client-server testing assistant. 
All tools are executed **on the client**; the model must:
  1. Call clientStepOne first,
  2. Pipe its data to clientStepTwo,
  3. Pipe its data to clientStepThree,
  4. Finally send the user a short natural-language summary.
Use clientSimpleLog for simple logging requests.`,
      messages,

      onError: (err) => console.error('💥 stream error', err),
      onFinish: ({ text, finishReason }) =>
        console.log('✅ stream finished – reason:', finishReason, 'len:', text?.length ?? 0),
    });

    return result.toDataStreamResponse();
  } catch (err) {
    console.error('💥 Route error:', err);
    return Response.json(
      { error: 'Failed to process request', message: err instanceof Error ? err.message : err },
      { status: 500 },
    );
  }
}
