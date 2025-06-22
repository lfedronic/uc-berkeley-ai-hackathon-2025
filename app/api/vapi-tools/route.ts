import { NextRequest, NextResponse } from 'next/server';
import { generateSummary } from '@/lib/agents/summaryAgent';
import { generateQuiz } from '@/lib/agents/quizAgent';
import { generateDiagram } from '@/lib/agents/diagramAgent';
import { generateWebpage } from '@/lib/agents/webpageAgent';

// Simple in-memory store for broadcasting tool results to clients
// In production, you'd use Redis or a proper message queue
const clientConnections = new Map<string, ReadableStreamDefaultController>();

// Define the actual Vapi message structure - handle both formats
interface VapiToolCallMessage {
  message: {
    timestamp: number;
    type: string;
    toolCallList?: Array<{
      id: string;
      name: string;
      arguments: Record<string, unknown>;
    }>;
    toolCalls?: Array<{
      id: string;
      type: string;
      function: {
        name: string;
        arguments: Record<string, unknown>;
      };
    }>;
    toolWithToolCallList?: Array<{
      type: string;
      name: string;
      parameters: Record<string, unknown>;
      description: string;
      server: {
        url: string;
      };
      messages: unknown[];
      toolCall: {
        id: string;
        type: string;
        function: {
          name: string;
          parameters: Record<string, unknown>;
        };
      };
    }>;
    artifact?: {
      messages: unknown[];
    };
    assistant?: {
      name: string;
      description: string;
      model: Record<string, unknown>;
      voice: Record<string, unknown>;
      artifactPlans: Record<string, unknown>;
      startSpeakingPlan: Record<string, unknown>;
    };
    call?: {
      id: string;
      orgId: string;
      type: string;
      assistant: Record<string, unknown>;
    };
  };
}

// Broadcast tool result to all connected clients
function broadcastToolResult(result: unknown) {
  const message = JSON.stringify({
    type: 'tool-result',
    data: result,
    timestamp: Date.now()
  });

  console.log('📡 Broadcasting to', clientConnections.size, 'clients. Result type:', (result as { contentType?: string })?.contentType || 'unknown');

  // Send to all connected clients
  for (const [clientId, controller] of clientConnections.entries()) {
    try {
      controller.enqueue(`data: ${message}\n\n`);
    } catch (error) {
      console.error(`Failed to send to client ${clientId}:`, error);
      // Remove dead connection
      clientConnections.delete(clientId);
    }
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 WEBHOOK CALLED - POST request received at /api/vapi-tools');
  console.log('🚀 Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    const body: VapiToolCallMessage = await request.json();
    
    console.log('🔧 Received Vapi tool call:', JSON.stringify(body, null, 2));
    
    // Use the actual Vapi message structure - handle both formats
    const messageType = body.message.type;
    const toolCalls = body.message.toolCalls || body.message.toolCallList;
    
    console.log('🔍 Message type:', messageType);
    console.log('🔍 Tool calls found:', !!toolCalls, toolCalls?.length || 0);
    console.log('🔍 Tool calls structure:', toolCalls);
    
    if (messageType !== 'tool-calls' || !toolCalls || toolCalls.length === 0) {
      console.log('❌ Invalid request format - type:', messageType, 'toolCalls:', !!toolCalls);
      return NextResponse.json({ 
        error: 'Invalid request format', 
        received: { type: messageType, hasToolCalls: !!toolCalls }
      }, { status: 400 });
    }

    const results = [];

    // Process each tool call with detailed logging
    for (let i = 0; i < toolCalls.length; i++) {
      const toolCall = toolCalls[i];
      console.log(`🔧 Processing tool call ${i + 1}/${toolCalls.length}:`, JSON.stringify(toolCall, null, 2));
      
      // Handle both toolCallList format and toolCalls format
      let toolName: string;
      let toolArgs: Record<string, unknown>;
      const toolId = toolCall.id;
      
      if ('name' in toolCall) {
        // toolCallList format
        toolName = toolCall.name;
        toolArgs = toolCall.arguments;
      } else if ('function' in toolCall) {
        // toolCalls format
        toolName = toolCall.function.name;
        toolArgs = toolCall.function.arguments;
      } else {
        console.error('❌ Unknown tool call format:', toolCall);
        results.push({
          toolCallId: toolId,
          result: {
            success: false,
            error: 'Unknown tool call format',
            message: 'Tool call format not recognized'
          }
        });
        continue;
      }
      
      console.log(`🔧 Processing tool: ${toolName} with args:`, toolArgs);
      console.log(`🔧 Tool ID: ${toolId}`);
      
      let result;
      
      try {
        console.log(`⏱️ Starting execution of ${toolName} (${i + 1}/${toolCalls.length})...`);
        const startTime = Date.now();
        
        // Wrap each tool call in its own timeout to prevent one slow call from affecting others
        const toolPromise = (async () => {
          switch (toolName) {
            case 'generateSummary':
              return await handleGenerateSummary(toolArgs as Record<string, unknown>);
            case 'generateQuiz':
              return await handleGenerateQuiz(toolArgs as Record<string, unknown>);
            case 'generateDiagram':
              return await handleGenerateDiagram(toolArgs as Record<string, unknown>);
            case 'generateWebpage':
              return await handleGenerateWebpage(toolArgs as Record<string, unknown>);
            default:
              return {
                success: false,
                error: 'Unknown tool',
                message: `Tool ${toolName} is not supported`
              };
          }
        })();

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Tool ${toolName} timed out after 15 seconds`)), 15000);
        });

        result = await Promise.race([toolPromise, timeoutPromise]) as { success: boolean; [key: string]: unknown };
        
        const executionTime = Date.now() - startTime;
        console.log(`✅ Tool ${toolName} (${i + 1}/${toolCalls.length}) completed in ${executionTime}ms`);
        console.log(`✅ Tool result success: ${result?.success}`);
        
      } catch (error) {
        console.error(`❌ Error executing tool ${toolName} (${i + 1}/${toolCalls.length}):`, error);
        console.error(`❌ Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
        result = {
          success: false,
          error: 'Tool execution failed',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error instanceof Error ? error.stack : undefined
        };
      }

      // Broadcast successful results to connected clients
      if (result && result.success) {
        console.log(`📡 Broadcasting tool result ${i + 1}/${toolCalls.length} to clients`);
        try {
          broadcastToolResult(result);
          console.log(`📡 Broadcast ${i + 1}/${toolCalls.length} completed successfully`);
        } catch (broadcastError) {
          console.error(`❌ Error broadcasting result ${i + 1}/${toolCalls.length}:`, broadcastError);
        }
      } else {
        console.log(`⚠️ Not broadcasting failed result ${i + 1}/${toolCalls.length}:`, result);
      }

      // Vapi expects the result to be a string, not an object
      let resultString: string;
      
      if (result && typeof result === 'object' && 'success' in result) {
        if (result.success) {
          // For successful results, stringify the entire result object
          resultString = JSON.stringify(result);
        } else {
          // For errors, create a readable error message
          const errorResult = result as { success: false; error?: string; details?: string; message?: string };
          resultString = `Error: ${errorResult.error || 'Unknown error'}${errorResult.details ? ` - ${errorResult.details}` : ''}${errorResult.message ? ` - ${errorResult.message}` : ''}`;
        }
      } else {
        // Fallback for unexpected result format
        resultString = JSON.stringify(result);
      }
      
      results.push({
        toolCallId: toolId,
        result: resultString
      });

      // Add a small delay between tool calls to prevent overwhelming the webhook
      if (i < toolCalls.length - 1) {
        console.log(`⏱️ Adding 500ms delay before processing next tool call...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('✅ All tool calls processed. Results count:', results.length);
    
    // Return results in the format Vapi expects
    const response = { results };
    console.log('📤 Sending response to Vapi:');
    console.log('📤 Response structure:', { 
      resultCount: results.length,
      resultTypes: results.map(r => ({ 
        toolCallId: r.toolCallId, 
        resultLength: typeof r.result === 'string' ? r.result.length : JSON.stringify(r.result).length 
      }))
    });
    console.log('📤 First result preview:', results[0] ? {
      toolCallId: results[0].toolCallId,
      resultStart: (typeof results[0].result === 'string' ? results[0].result : JSON.stringify(results[0].result)).substring(0, 200) + '...'
    } : 'No results');
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error processing Vapi tool calls:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    const errorResponse = { 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    };
    
    console.log('📤 Sending error response:', JSON.stringify(errorResponse, null, 2));
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// SSE endpoint for clients to receive tool results
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');
  const healthCheck = searchParams.get('health');
  
  // Health check endpoint
  if (healthCheck === 'true') {
    console.log('🏥 Health check requested');
    return NextResponse.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      connectedClients: clientConnections.size,
      supportedTools: ['generateSummary', 'generateQuiz', 'generateDiagram', 'generateWebpage']
    });
  }
  
  const finalClientId = clientId || `client-${Date.now()}`;
  console.log('🔌 Client connecting to SSE:', finalClientId);

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Store the controller for this client
      clientConnections.set(finalClientId, controller);
      
      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({
        type: 'connected',
        clientId: finalClientId,
        timestamp: Date.now()
      })}\n\n`);
      
      console.log('✅ Client connected:', finalClientId, 'Total clients:', clientConnections.size);
    },
    cancel() {
      // Clean up when client disconnects
      clientConnections.delete(finalClientId);
      console.log('❌ Client disconnected:', finalClientId, 'Remaining clients:', clientConnections.size);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

async function handleGenerateSummary(args: Record<string, unknown>) {
  console.log('📝 handleGenerateSummary called with args:', args);
  
  try {
    const { concept, type = 'concept' } = args as {
      concept: string;
      type?: 'concept' | 'lesson-plan' | 'course-overview';
    };

    console.log('📝 Extracted parameters - concept:', concept, 'type:', type);

    if (!concept) {
      console.log('❌ Missing concept parameter');
      return {
        success: false,
        error: 'Missing required parameter: concept'
      };
    }

    console.log('📝 Calling generateSummary function...');
    const startTime = Date.now();
    
    // Add timeout protection - reduce to 10 seconds to prevent webhook timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Summary generation timed out after 10 seconds')), 10000);
    });
    
    const summaryPromise = generateSummary({
      concept,
      type,
    });
    
    let summary: string;
    
    try {
      summary = await Promise.race([summaryPromise, timeoutPromise]) as string;
    } catch (apiError) {
      console.error('❌ API call failed, using fallback summary:', apiError);
      
      // Fallback summary for testing
      summary = `# ${concept}

## Overview

This is a fallback summary for "${concept}" generated when the AI service is unavailable.

## Key Points

* **Definition**: ${concept} is an important concept in its field
* **Applications**: Used in various practical scenarios
* **Importance**: Essential for understanding related topics

## Detailed Explanation

${concept} represents a fundamental concept that students should understand. This fallback content is generated when the main AI service experiences issues.

## Learning Objectives

After studying this topic, students will be able to:
* Define ${concept}
* Explain its basic principles
* Apply knowledge in practical situations

## Practice Questions

1. What is ${concept}?
2. How is ${concept} used in practice?
3. Why is ${concept} important?

## Additional Resources

* Search for "${concept}" in educational databases
* Consult textbooks related to this topic
* Look for online tutorials and videos

*Note: This is a fallback summary. The full AI-generated content will be available when the service is restored.*`;

      console.log('📝 Using fallback summary, length:', summary.length);
    }
    
    const executionTime = Date.now() - startTime;
    console.log(`📝 generateSummary completed in ${executionTime}ms`);
    console.log('📝 Summary length:', summary?.length || 0);
    console.log('📝 Summary preview:', summary?.substring(0, 100) + '...');

    const result = {
      success: true,
      content: summary,
      type: type,
      concept: concept,
      contentType: 'summary'
    };
    
    console.log('📝 Returning result:', { ...result, content: `[${result.content.length} chars]` });
    return result;
    
  } catch (error) {
    console.error('❌ Error in handleGenerateSummary:', error);
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return {
      success: false,
      error: 'Failed to generate summary',
      details: error instanceof Error ? error.message : 'Unknown error',
      errorType: typeof error,
      timestamp: new Date().toISOString()
    };
  }
}

async function handleGenerateQuiz(args: Record<string, unknown>) {
  try {
    const { topic, difficulty, questionCount, questionTypes } = args as {
      topic: string;
      difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
      questionCount?: number;
      questionTypes?: Array<'mcq' | 'short-answer' | 'true-false' | 'fill-blank'>;
    };

    if (!topic) {
      return {
        success: false,
        error: 'Missing required parameter: topic'
      };
    }

    const quiz = await generateQuiz({
      topic,
      difficulty,
      questionCount,
      questionTypes,
    });

    return {
      success: true,
      quiz: quiz,
      topic: topic,
      contentType: 'quiz'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to generate quiz',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function handleGenerateDiagram(args: Record<string, unknown>) {
  try {
    const { concept, type, complexity } = args as {
      concept: string;
      type?: 'flowchart' | 'mindmap' | 'sequence' | 'class' | 'timeline' | 'auto';
      complexity?: 'simple' | 'detailed' | 'comprehensive';
    };

    if (!concept) {
      return {
        success: false,
        error: 'Missing required parameter: concept'
      };
    }

    const diagram = await generateDiagram({
      concept,
      type,
      complexity,
    });

    return {
      success: true,
      diagram: diagram,
      concept: concept,
      contentType: 'diagram'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to generate diagram',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function handleGenerateWebpage(args: Record<string, unknown>) {
  try {
    const { concept, type, complexity, framework } = args as {
      concept: string;
      type?: 'interactive-html' | 'python-chart' | 'simulation' | 'auto';
      complexity?: 'simple' | 'detailed' | 'comprehensive';
      framework?: 'vanilla-js' | 'react' | 'matplotlib' | 'plotly' | 'auto';
    };

    if (!concept) {
      return {
        success: false,
        error: 'Missing required parameter: concept'
      };
    }

    const webpage = await generateWebpage({
      concept,
      type,
      complexity,
      framework,
    });

    return {
      success: true,
      webpage: webpage,
      concept: concept,
      contentType: 'webpage'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to generate webpage',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

