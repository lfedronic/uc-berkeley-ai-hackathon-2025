import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { stepOneTool, stepTwoTool, stepThreeTool, simpleLogTool } from '@/lib/agents/testTools';

export async function POST(req: Request) {
  console.log('🧪 TEST MULTISTEP API Route Hit');
  
  try {
    const { messages } = await req.json();
    console.log('📨 Test request body:', { 
      messagesCount: messages?.length
    });

    if (!messages || !Array.isArray(messages)) {
      console.log('❌ Invalid messages parameter');
      return Response.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    console.log('✅ Test request validation passed');
    console.log('🔑 OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);

    // Define test tools with execute functions
    const tools = {
      stepOne: stepOneTool,
      stepTwo: stepTwoTool,
      stepThree: stepThreeTool,
      simpleLog: simpleLogTool,
    };

    console.log('🧪 Calling OpenAI o3-mini with test tools...');
    console.log('🔧 Test tools available:', Object.keys(tools));
    
    // Simple message filtering - just include messages with content
    const safeMessages = messages.filter(
      (m: any) => m.content && typeof m.content === "string" && m.content.trim().length
    );

    console.log('📝 Original messages count:', messages.length);
    console.log('📝 Safe messages count:', safeMessages.length);
    
    // Debug: Log the exact messages being sent
    console.log('📝 Messages being sent to OpenAI:');
    safeMessages.forEach((msg: any, index: number) => {
      console.log(`  Message ${index}:`, {
        role: msg.role,
        content: msg.content?.substring(0, 100) + (msg.content?.length > 100 ? '...' : ''),
      });
    });
    
    const result = await streamText({
      model: openai('o3-mini'),
      tools,
      maxSteps: 10, // Allow up to 10 steps for testing
      system: `You are a multi-step process testing assistant. You have access to several test tools that execute steps in sequence.

Available tools:
- stepOne: Execute the first step of a process (takes a message)
- stepTwo: Execute the second step (takes previousData from step 1 and an action)
- stepThree: Execute the final step (takes previousData from step 2 and a finalAction)
- simpleLog: Just log a message with a level (info, success, warning, error)

When a user asks you to perform multi-step operations, use the tools in sequence:
1. Use stepOne first with the user's initial message
2. Use stepTwo with the data from step 1 and an appropriate action
3. Use stepThree with the data from step 2 and a final action

For simple logging requests, use the simpleLog tool.

Examples:
- "Execute a three-step process to handle my request" → use stepOne, then stepTwo, then stepThree
- "Log a success message" → use simpleLog
- "Process my data in multiple steps" → use stepOne, stepTwo, stepThree in sequence

Always use the tools to perform the requested actions. The tools will log to the console so we can see the execution.`,
      messages: safeMessages,
      
      // Add error handling for streaming
      onError: (error) => {
        console.error('💥 Test stream error:', error);
      },
      
      // Add onFinish callback for diagnostics
      onFinish: ({ text, usage, finishReason, toolCalls, toolResults, ...rest }) => {
        console.log('🔍 SERVER-SIDE FINISH CALLBACK:');
        console.log('- Text length:', text?.length || 0);
        console.log('- Text preview:', text?.substring(0, 200) || 'NO TEXT');
        console.log('- Usage:', usage);
        console.log('- Finish Reason:', finishReason);
        console.log('- Tool Calls:', toolCalls?.length || 0);
        console.log('- Tool Results:', toolResults?.length || 0);
        console.log('- Steps taken:', rest.steps?.length || 0);
        if (text === undefined || text === '') {
          console.error('❌ SERVER-SIDE: Empty text response detected!');
        } else {
          console.log('✅ SERVER-SIDE: Text response generated successfully');
        }
      },
    });

    console.log('✅ Test StreamText result created successfully');
    
    // Return the streaming response
    const response = result.toDataStreamResponse();
    console.log('✅ Test DataStreamResponse created');
    
    return response;

  } catch (error) {
    console.error('💥 Test multistep error:', error);
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return Response.json(
      { 
        success: false,
        error: 'Failed to process test multistep command',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
