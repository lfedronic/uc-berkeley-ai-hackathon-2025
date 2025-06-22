import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { generateSummary } from '@/lib/agents/summaryAgent';
import { generateQuiz } from '@/lib/agents/quizAgent';
import { generateDiagram } from '@/lib/agents/diagramAgent';

// Initialize the Google AI provider
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

// Define the tools
const tools = {
  generateSummary: tool({
    description: 'Generate educational summaries, lesson plans, or course overviews for learning concepts',
    parameters: z.object({
      concept: z.string().describe('The concept, topic, or subject to create content for'),
      type: z.enum(['concept', 'lesson-plan', 'course-overview']).describe('Type of content to generate: concept summary, detailed lesson plan, or full course overview'),
    }),
    execute: async ({ concept, type }) => {
      try {
        const summary = await generateSummary({
          concept,
          type,
        });
        return { 
          success: true,
          content: summary,
          type: type,
          concept: concept,
          contentType: 'summary'
        };
      } catch (error) {
        return { 
          success: false, 
          error: 'Failed to generate summary',
          details: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    },
  }),
  generateQuiz: tool({
    description: 'Generate interactive quizzes and problem sets for learning topics with multiple question types (MCQ, short answer, true/false, fill-in-blank)',
    parameters: z.object({
      topic: z.string().describe('The topic or subject to create a quiz for'),
      difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).optional().describe('Difficulty level of the quiz questions'),
      questionCount: z.number().min(1).max(20).optional().describe('Number of questions to generate (1-20, default: 5)'),
      questionTypes: z.array(z.enum(['mcq', 'short-answer', 'true-false', 'fill-blank'])).optional().describe('Types of questions to include'),
    }),
    execute: async ({ topic, difficulty, questionCount, questionTypes }) => {
      try {
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
    },
  }),
  generateDiagram: tool({
    description: 'Generate visual Mermaid diagrams to help explain concepts, processes, relationships, and educational content',
    parameters: z.object({
      concept: z.string().describe('The concept, topic, or subject to create a diagram for'),
      type: z.enum(['flowchart', 'mindmap', 'sequence', 'class', 'timeline', 'auto']).optional().describe('Type of diagram: flowchart (processes/workflows), mindmap (concept relationships), sequence (interactions), class (object relationships), timeline (chronological events), or auto (let AI choose)'),
      complexity: z.enum(['simple', 'detailed', 'comprehensive']).optional().describe('Complexity level: simple (3-5 elements), detailed (6-12 elements), comprehensive (12+ elements)'),
    }),
    execute: async ({ concept, type, complexity }) => {
      try {
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
      system: `You are an AI learning assistant. You have access to the following tools:
      
      - generateSummary: Use this tool when users ask for:
        * Summaries of concepts or topics (type: "concept")
        * Lesson plans for teaching a subject (type: "lesson-plan") 
        * Course overviews or curricula (type: "course-overview")
        Examples: "Can you give me a summary of photosynthesis?", "Create a lesson plan for algebra", "I need a course overview for web development"
        
      - generateQuiz: Use this tool when users ask for:
        * Quizzes, tests, or problem sets on a topic
        * Practice questions or exercises
        * Assessment materials
        Examples: "Create a quiz on calculus", "Generate practice problems for chemistry", "Make a test for JavaScript basics"
        
      - generateDiagram: Use this tool when users ask for:
        * Visual explanations of concepts or processes
        * Diagrams to understand relationships or workflows
        * Mind maps, flowcharts, or other visual aids
        * Help visualizing complex topics
        Examples: "Show me a diagram of photosynthesis", "Create a flowchart for the software development process", "I need a mind map for project management concepts", "Visualize how neural networks work"
        
      Choose the appropriate tool based on what the user is requesting. Summary content will be displayed as formatted markdown, quizzes will be displayed as interactive forms where users can answer questions and get scored, and diagrams will be rendered as interactive Mermaid visualizations.`,
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
