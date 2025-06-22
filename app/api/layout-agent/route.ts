import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { layoutTool, getLayoutContext } from '@/lib/agents/aiLayoutTools';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
      return Response.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Get current layout context for the AI
    const layoutContext = getLayoutContext();

    const result = await generateText({
      model: google('gemini-2.0-flash-exp'),
      tools: { layout: layoutTool },
      maxSteps: 5,
      system: `You are a layout management assistant for a multimodal AI tutor interface. 
        You help users control a dynamic split-screen layout with tabs.
        
        Your capabilities:
        - Add new tabs to existing panes
        - Switch between tabs in panes  
        - Close tabs (can close last tab to remove pane)
        - Split panes to create new sections
        - Get current layout information
        
        Guidelines:
        - Always check current layout state first if needed
        - Be helpful and explain what you're doing
        - If a user request is ambiguous, ask for clarification
        - Suggest appropriate content types (lecture, quiz, diagram, summary)
        - Keep responses concise but informative
        
        Current Layout Context:
        ${layoutContext}`,
      messages: [
        {
          role: 'user',
          content: message
        }
      ]
    });

    return Response.json({
      success: true,
      response: result.text,
      toolResults: result.toolResults,
      steps: result.steps?.length || 0
    });

  } catch (error) {
    console.error('Layout agent error:', error);
    
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
