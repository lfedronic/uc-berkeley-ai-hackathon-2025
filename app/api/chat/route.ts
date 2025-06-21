import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';

// Initialize the Google AI provider
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

// Define the tools
const tools = {
  printYes: tool({
    description: 'Prints "yes" to the console and returns a confirmation message',
    parameters: z.object({}),
    execute: async () => {
      console.log('yes');
      return { message: 'Successfully printed "yes" to console' };
    },
  }),
  printNo: tool({
    description: 'Prints "no" to the console and returns a confirmation message',
    parameters: z.object({}),
    execute: async () => {
      console.log('no');
      return { message: 'Successfully printed "no" to console' };
    },
  }),
};

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Create a stream with tool support
    const result = await streamText({
      model: google('gemini-2.5-flash'),
      messages,
      tools,
      system: `You are a helpful AI assistant. You have access to two tools:
      - printYes: Use this tool when the user asks you to print "yes" or when a positive response is needed
      - printNo: Use this tool when the user asks you to print "no" or when a negative response is needed
      
      Call the appropriate tool based on the user's request.`,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
