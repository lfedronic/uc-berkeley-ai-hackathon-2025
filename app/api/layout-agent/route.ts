import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, tool } from 'ai';
import { z } from 'zod';

// Initialize the Google AI provider (matching working chat API)
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

export async function POST(req: Request) {
  console.log('🔥 API Route Hit - layout-agent');
  console.log('📨 Request method:', req.method);
  console.log('📨 Request URL:', req.url);
  console.log('🌐 Request headers:', Object.fromEntries(req.headers.entries()));
  
  try {
    console.log('📦 Parsing request body...');
    const requestBody = await req.json();
    console.log('📨 Request body:', requestBody);
    
    const { message, layoutState } = requestBody;

    if (!message || typeof message !== 'string') {
      console.log('❌ Invalid message parameter');
      return Response.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    if (!layoutState) {
      console.log('❌ Missing layout state');
      return Response.json(
        { error: 'Layout state is required' },
        { status: 400 }
      );
    }

    console.log('✅ Request validation passed');
    console.log('🔑 Google API Key exists:', !!process.env.GOOGLE_API_KEY);
    console.log('🔑 Google API Key length:', process.env.GOOGLE_API_KEY?.length || 0);

    // Format layout context for the AI
    const layoutContext = `Current Layout State:
- Available Panes: ${layoutState.availablePanes.join(', ')}
- Available Tabs: ${layoutState.availableTabs.map((t: any) => `"${t.name}" (${t.id}) in ${t.paneId}`).join(', ')}
- Total Panes: ${layoutState.totalPanes}
- Total Tabs: ${layoutState.totalTabs}`;

    console.log('📋 Layout context:', layoutContext);

    // Define tools using the same pattern as working chat API
    const tools = {
      manageLayout: tool({
        description: 'Manage the split-screen UI layout by adding tabs, switching tabs, closing tabs, or splitting panes',
        parameters: z.object({
          action: z.enum(['addTab', 'activateTab', 'closeTab', 'split', 'getEnv']).describe('The layout action to perform'),
          paneId: z.string().optional().describe('ID of the pane/tabset (required for addTab, activateTab, split)'),
          title: z.string().optional().describe('Title for the new tab (required for addTab)'),
          contentId: z.enum(['lecture', 'quiz', 'diagram', 'summary', 'placeholder']).optional().describe('Content type for the new tab (required for addTab)'),
          makeActive: z.boolean().optional().default(true).describe('Whether to make the new tab active (for addTab)'),
          tabId: z.string().optional().describe('ID of the tab to activate or close (required for activateTab, closeTab)'),
          orientation: z.enum(['row', 'column']).optional().describe('Split orientation: row (left/right) or column (top/bottom) (required for split)'),
          ratio: z.number().min(0.1).max(0.9).optional().default(0.5).describe('Split ratio between 0.1 and 0.9 (for split)'),
        }),
        execute: async ({ action, paneId, title, contentId, makeActive, tabId, orientation, ratio }) => {
          console.log('🔧 Layout tool called with:', { action, paneId, title, contentId, makeActive, tabId, orientation, ratio });
          
          try {
            const { availablePanes, availableTabs } = layoutState;
            
            // Generate the command to be executed on the client
            let command: any;
            
            switch (action) {
              case 'addTab':
                if (!paneId || !title || !contentId) {
                  return {
                    success: false,
                    error: 'Missing required parameters for addTab: paneId, title, contentId',
                    availablePanes,
                    availableTabs,
                    hint: `Available panes: ${availablePanes.join(', ')}`,
                    command: null
                  };
                }
                
                if (!availablePanes.includes(paneId)) {
                  return {
                    success: false,
                    error: `Pane ${paneId} not found`,
                    availablePanes,
                    availableTabs,
                    hint: `Available panes: ${availablePanes.join(', ')}`,
                    command: null
                  };
                }
                
                command = {
                  action: 'addTab',
                  paneId,
                  title,
                  contentId,
                  makeActive: makeActive ?? true
                };
                break;
                
              case 'activateTab':
                if (!paneId || !tabId) {
                  return {
                    success: false,
                    error: 'Missing required parameters for activateTab: paneId, tabId',
                    availablePanes,
                    availableTabs,
                    hint: `Available tabs: ${availableTabs.map((t: any) => `${t.name} (${t.id})`).join(', ')}`,
                    command: null
                  };
                }
                
                const tabExists = availableTabs.some((t: any) => t.id === tabId);
                if (!tabExists) {
                  return {
                    success: false,
                    error: `Tab ${tabId} not found`,
                    availablePanes,
                    availableTabs,
                    hint: `Available tabs: ${availableTabs.map((t: any) => `${t.name} (${t.id})`).join(', ')}`,
                    command: null
                  };
                }
                
                command = {
                  action: 'activateTab',
                  paneId,
                  tabId
                };
                break;
                
              case 'closeTab':
                if (!tabId) {
                  return {
                    success: false,
                    error: 'Missing required parameter for closeTab: tabId',
                    availablePanes,
                    availableTabs,
                    hint: `Available tabs: ${availableTabs.map((t: any) => `${t.name} (${t.id})`).join(', ')}`,
                    command: null
                  };
                }
                
                const tabToClose = availableTabs.find((t: any) => t.id === tabId);
                if (!tabToClose) {
                  return {
                    success: false,
                    error: `Tab ${tabId} not found`,
                    availablePanes,
                    availableTabs,
                    hint: `Available tabs: ${availableTabs.map((t: any) => `${t.name} (${t.id})`).join(', ')}`,
                    command: null
                  };
                }
                
                command = {
                  action: 'closeTab',
                  tabId
                };
                break;
                
              case 'split':
                if (!paneId || !orientation) {
                  return {
                    success: false,
                    error: 'Missing required parameters for split: paneId, orientation',
                    availablePanes,
                    availableTabs,
                    hint: `Available panes: ${availablePanes.join(', ')}, orientations: row, column`,
                    command: null
                  };
                }
                
                if (!availablePanes.includes(paneId)) {
                  return {
                    success: false,
                    error: `Pane ${paneId} not found`,
                    availablePanes,
                    availableTabs,
                    hint: `Available panes: ${availablePanes.join(', ')}`,
                    command: null
                  };
                }
                
                command = {
                  action: 'split',
                  paneId,
                  orientation,
                  ratio: ratio ?? 0.5
                };
                break;
                
              case 'getEnv':
                return {
                  success: true,
                  message: 'Current layout environment',
                  environment: {
                    availablePanes,
                    availableTabs,
                    totalPanes: availablePanes.length,
                    totalTabs: availableTabs.length,
                    layoutStructure: 'Current layout has panes that can contain multiple tabs'
                  },
                  command: null
                };
                
              default:
                return {
                  success: false,
                  error: `Unknown action: ${action}`,
                  availablePanes,
                  availableTabs,
                  command: null
                };
            }
            
            // Return the command for client execution
            console.log('✅ Generated command:', command);
            return {
              success: true,
              message: `Generated ${action} command`,
              command,
              action: action
            };
            
          } catch (error) {
            console.error('💥 Tool execution error:', error);
            return {
              success: false,
              error: 'Unexpected error in layout tool execution',
              details: error instanceof Error ? error.message : 'Unknown error',
              command: null
            };
          }
        },
      }),
    };

    console.log('🤖 Calling Gemini 2.5 Flash...');
    console.log('🔧 Tools available:', Object.keys(tools));
    
    const result = await generateText({
      model: google('gemini-2.5-flash'),
      tools,
      maxSteps: 5,
      system: `You are a layout management assistant for a multimodal AI tutor interface. You have access to the following tool:

- manageLayout: Use this tool when users ask to:
  * Add new tabs to panes (action: "addTab") - Examples: "Add a homework tab", "Create a new quiz tab"
  * Switch between tabs (action: "activateTab") - Examples: "Switch to the summary tab", "Show the lecture tab"
  * Close tabs (action: "closeTab") - Examples: "Close the diagram tab", "Remove the quiz tab"
  * Split panes (action: "split") - Examples: "Split the lecture pane", "Divide the quiz section"
  * Get layout info (action: "getEnv") - Examples: "Show current layout", "What tabs are available"

IMPORTANT: Always use the manageLayout tool for any layout-related requests. Do not just describe what you would do - actually call the tool.

${layoutContext}

Available panes: ${layoutState.availablePanes.join(', ')}
Available tabs: ${layoutState.availableTabs.map((t: any) => `"${t.name}" (${t.id}) in ${t.paneId}`).join(', ')}`,
      messages: [
        {
          role: 'user',
          content: message
        }
      ]
    });

    console.log('✅ Gemini response received');
    console.log('📝 Response text:', result.text);
    console.log('🔧 Tool results:', result.toolResults);

    const response = {
      success: true,
      response: result.text,
      toolResults: result.toolResults,
      steps: result.steps?.length || 0
    };

    console.log('📤 Sending response:', response);
    return Response.json(response);

  } catch (error) {
    console.error('💥 Layout agent error:', error);
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    const errorResponse = { 
      success: false,
      error: 'Failed to process layout command',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
    
    console.log('📤 Sending error response:', errorResponse);
    return Response.json(errorResponse, { status: 500 });
  }
}
