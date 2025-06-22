import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { layoutTool, formatLayoutContext } from '@/lib/agents/layoutTool';

// Initialize the Google AI provider
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

export async function POST(req: Request) {
  console.log('🔥 API Route Hit - layout-agent');
  
  try {
    const { messages, context } = await req.json();
    console.log('📨 Request body:', { messages: messages?.length, context });

    if (!messages || !Array.isArray(messages)) {
      console.log('❌ Invalid messages parameter');
      return Response.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    console.log('✅ Request validation passed');
    console.log('🔑 Google API Key exists:', !!process.env.GOOGLE_API_KEY);

    // Extract layout state from context
    const layoutState = context?.layoutState;
    const layoutContext = formatLayoutContext(layoutState);
    console.log('📋 Layout context:', layoutContext);

    // Define tools - layout tool has NO execute function
    const tools = {
      layout: layoutTool,
    };

    console.log('🤖 Calling Gemini 2.5 Flash with streamText...');
    console.log('🔧 Tools available:', Object.keys(tools));
    
    const result = await streamText({
      model: google('gemini-2.5-flash'),
      tools,
      maxSteps: 5,
      system: `You are a layout management assistant for a multimodal AI tutor interface. You have access to the layout tool to control a dynamic split-screen UI.

Use the layout tool when users ask to:
- Add new tabs to panes (action: "addTab") - Examples: "Add a homework tab", "Create a new quiz tab"
- Switch between tabs (action: "activateTab") - Examples: "Switch to the summary tab", "Show the lecture tab"  
- Close tabs (action: "closeTab") - Examples: "Close the diagram tab", "Remove the quiz tab"
- Split panes (action: "split") - Examples: "Split the lecture pane", "Divide the quiz section"
- Get layout info (action: "getEnv") - Examples: "Show current layout", "What tabs are available"

IMPORTANT: Always use the layout tool for any layout-related requests. Do not just describe what you would do - actually call the tool.

${layoutContext}

Guidelines:
- Be helpful and explain what you're doing
- If a user request is ambiguous, ask for clarification
- Suggest appropriate content types (lecture, quiz, diagram, summary, placeholder)
- Keep responses concise but informative`,
      messages,
    });

    console.log('✅ StreamText result created');
    return result.toDataStreamResponse();

  } catch (error) {
    console.error('💥 Layout agent error:', error);
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return Response.json(
      { 
        success: false,
        error: 'Failed to process layout command',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
