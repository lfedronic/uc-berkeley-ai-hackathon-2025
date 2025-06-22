import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { layoutTool, formatLayoutContext } from '@/lib/agents/layoutTool';

export async function POST(req: Request) {
  console.log('🔥 API Route Hit - layout-agent');
  
  try {
    const { messages, context } = await req.json();
    console.log('📨 Request body:', { 
      messagesCount: messages?.length, 
      contextKeys: context ? Object.keys(context) : [] 
    });

    if (!messages || !Array.isArray(messages)) {
      console.log('❌ Invalid messages parameter');
      return Response.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    console.log('✅ Request validation passed');
    console.log('🔑 OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);

    // Extract layout state from context
    const layoutState = context?.layoutState;
    const layoutContext = formatLayoutContext(layoutState);
    console.log('📋 Layout context formatted');

    // Define tools - layout tool has NO execute function
    const tools = {
      layout: layoutTool,
    };

    console.log('🤖 Calling OpenAI o3-mini with streamText...');
    console.log('🔧 Tools available:', Object.keys(tools));
    
    // Validation function - Fix #3: Handle tool messages and assistant messages properly
    function assertMessagesSafe(msgs: any[]) {
      for (const [i, m] of msgs.entries()) {
        // Tool messages are always valid (they contain tool results)
        if (m.role === "tool") {
          continue;
        }
        
        // Assistant messages are valid if they have content, tool calls, or tool invocations
        if (m.role === "assistant") {
          if (m.content?.trim() || m.toolCalls?.length || m.toolInvocations?.length) {
            continue;
          }
          throw new Error(`Assistant message #${i} has no content, tool calls, or tool invocations`);
        }
        
        // All other messages need content
        if (!m.content?.trim()) {
          throw new Error(`Message #${i} (role: ${m.role}) has no content - this will cause API 400 error`);
        }
      }
    }

    // Fix #2: Filter out empty messages but always include tool messages and assistant messages
    const safeMessages = messages.filter(
      (m: any) => {
        // Always include tool messages (they contain tool results)
        if (m.role === "tool") {
          return true;
        }
        
        // Always include user messages with content
        if (m.role === "user" && m.content && typeof m.content === "string" && m.content.trim().length) {
          return true;
        }
        
        // Include assistant messages if they have content OR tool calls OR tool invocations
        if (m.role === "assistant") {
          return (
            (m.content && typeof m.content === "string" && m.content.trim().length) ||
            m.toolCalls?.length ||
            m.toolInvocations?.length
          );
        }
        
        // Include any other messages with valid content
        return m.content && typeof m.content === "string" && m.content.trim().length;
      }
    );

    console.log('📝 Original messages count:', messages.length);
    console.log('📝 Safe messages count:', safeMessages.length);
    
    // Fix #7: Add comprehensive debugging - log the exact payload sent to OpenAI
    console.log('🔍 DEBUGGING: Complete payload being sent to OpenAI:');
    console.log(JSON.stringify({ 
      system: 'Layout management assistant...', 
      tools: Object.keys(tools), 
      messages: safeMessages 
    }, null, 2));
    
    // Debug: Log the exact messages being sent to OpenAI
    console.log('📝 Safe messages being sent to OpenAI:');
    safeMessages.forEach((msg: any, index: number) => {
      console.log(`  Message ${index}:`, {
        role: msg.role,
        content: msg.content?.substring(0, 100) + (msg.content?.length > 100 ? '...' : ''),
        toolInvocations: msg.toolInvocations?.length || 0,
        toolCalls: msg.toolCalls?.length || 0,
        hasContent: !!msg.content,
        contentLength: msg.content?.length || 0,
        isToolMessage: msg.role === "tool",
        toolCallId: msg.tool_call_id || 'none'
      });
    });

    // Validate messages are safe
    try {
      assertMessagesSafe(safeMessages);
      console.log('✅ Messages passed validation');
    } catch (error) {
      console.error('❌ Message validation failed:', error);
      throw error;
    }
    
    const result = await streamText({
      model: openai('o3-mini'),
      tools,
      maxSteps: 128, // Fix #6: Increase from 25 to 128 for longer conversations
      system: `You are a layout management assistant for a multimodal AI tutor interface. You have access to the layout tool to control a dynamic split-screen UI.

CRITICAL: When calling the layout tool, use a FLAT parameter structure. All parameters go at the TOP LEVEL, not nested under "action".

CORRECT tool call format:
{
  "action": "addTab",
  "paneId": "quiz-pane", 
  "title": "Homework",
  "contentId": "quiz"
}

WRONG (do NOT do this):
{
  "action": {
    "action": "addTab",
    "paneId": "quiz-pane",
    "title": "Homework" 
  }
}

**Parameter Reference:**

addTab: action, paneId, title, contentId, makeActive(optional)
activateTab: action, paneId, tabId  
closeTab: action, tabId
split: action, paneId, orientation, ratio(optional)
getEnv: action

**CRITICAL: contentId must be EXACTLY one of these values:**
- "lecture" - for lecture notes, slides, presentations
- "quiz" - for homework, quizzes, assignments, tests
- "diagram" - for charts, graphs, visual content
- "summary" - for summaries, notes, conclusions
- "placeholder" - for empty or generic content

**ContentId Usage Examples:**
- Homework tab → "quiz"
- Assignment tab → "quiz" 
- Lecture notes → "lecture"
- Presentation → "lecture"
- Chart/graph → "diagram"
- Summary notes → "summary"

${layoutContext}

Examples of CORRECT flat structure:
- {"action": "closeTab", "tabId": "diagram-tab"}
- {"action": "addTab", "paneId": "quiz-pane", "title": "Homework", "contentId": "quiz"}
- {"action": "addTab", "paneId": "lecture-pane", "title": "Lecture Notes", "contentId": "lecture"}
- {"action": "split", "paneId": "lecture-pane", "orientation": "row"}

Always use the layout tool for layout requests and keep parameters FLAT.`,
      messages: safeMessages,
      
      // Add error handling for streaming
      onError: (error) => {
        console.error('💥 Stream error:', error);
      },
    });

    console.log('✅ StreamText result created successfully');
    
    // Return the streaming response
    const response = result.toDataStreamResponse();
    console.log('✅ DataStreamResponse created');
    
    return response;

  } catch (error) {
    console.error('💥 Layout agent error:', error);
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('💥 Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      cause: error instanceof Error ? error.cause : undefined
    });
    
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
