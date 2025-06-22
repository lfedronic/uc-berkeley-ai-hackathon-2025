# Vapi Voice Assistant Setup Guide

This guide will help you set up the Vapi voice assistant with educational tool calling capabilities.

## Prerequisites

1. **Vapi Account**: Sign up at [vapi.ai](https://vapi.ai)
2. **Google API Key**: Get your API key from [ai.google.dev](https://ai.google.dev)
3. **Environment Variables**: Set up your `.env.local` file

## Environment Setup

Create a `.env.local` file in your project root with:

```bash
# Google AI API Key (for content generation)
GOOGLE_API_KEY=your_google_api_key_here

# Vapi Configuration
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key_here
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_assistant_id_here
```

## Vapi Dashboard Configuration

### Step 1: Create Tools in Vapi Dashboard

Go to **Tools** section in Vapi Dashboard and create the following tools:

#### 1. Generate Summary Tool
- **Tool Name**: `Generate Summary`
- **Function Name**: `generateSummary`
- **Description**: `Generate educational summaries, lesson plans, or course overviews for learning concepts`
- **Server URL**: `https://your-domain.com/api/vapi-tools`
- **HTTP Method**: `POST`
- **Parameters**:
  ```json
  {
    "type": "object",
    "properties": {
      "concept": {
        "type": "string",
        "description": "The concept, topic, or subject to create content for"
      },
      "type": {
        "type": "string",
        "enum": ["concept", "lesson-plan", "course-overview"],
        "description": "Type of content to generate"
      }
    },
    "required": ["concept"]
  }
  ```

#### 2. Generate Quiz Tool
- **Tool Name**: `Generate Quiz`
- **Function Name**: `generateQuiz`
- **Description**: `Generate interactive quizzes and problem sets for learning topics`
- **Server URL**: `https://your-domain.com/api/vapi-tools`
- **Parameters**:
  ```json
  {
    "type": "object",
    "properties": {
      "topic": {
        "type": "string",
        "description": "The topic or subject to create a quiz for"
      },
      "difficulty": {
        "type": "string",
        "enum": ["easy", "medium", "hard", "mixed"],
        "description": "Difficulty level of the quiz questions"
      },
      "questionCount": {
        "type": "number",
        "minimum": 1,
        "maximum": 20,
        "description": "Number of questions to generate (1-20, default: 5)"
      },
      "questionTypes": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": ["mcq", "short-answer", "true-false", "fill-blank"]
        },
        "description": "Types of questions to include"
      }
    },
    "required": ["topic"]
  }
  ```

#### 3. Generate Diagram Tool
- **Tool Name**: `Generate Diagram`
- **Function Name**: `generateDiagram`
- **Description**: `Generate visual Mermaid diagrams to help explain concepts and processes`
- **Server URL**: `https://your-domain.com/api/vapi-tools`
- **Parameters**:
  ```json
  {
    "type": "object",
    "properties": {
      "concept": {
        "type": "string",
        "description": "The concept, topic, or subject to create a diagram for"
      },
      "type": {
        "type": "string",
        "enum": ["flowchart", "mindmap", "sequence", "class", "timeline", "auto"],
        "description": "Type of diagram to generate"
      },
      "complexity": {
        "type": "string",
        "enum": ["simple", "detailed", "comprehensive"],
        "description": "Complexity level of the diagram"
      }
    },
    "required": ["concept"]
  }
  ```

#### 4. Generate Webpage Tool
- **Tool Name**: `Generate Webpage`
- **Function Name**: `generateWebpage`
- **Description**: `Generate custom interactive webpages, simulations, or Python visualizations`
- **Server URL**: `https://your-domain.com/api/vapi-tools`
- **Parameters**:
  ```json
  {
    "type": "object",
    "properties": {
      "concept": {
        "type": "string",
        "description": "The concept, topic, or subject to create an interactive demonstration for"
      },
      "type": {
        "type": "string",
        "enum": ["interactive-html", "python-chart", "simulation", "auto"],
        "description": "Type of content to generate"
      },
      "complexity": {
        "type": "string",
        "enum": ["simple", "detailed", "comprehensive"],
        "description": "Complexity level"
      },
      "framework": {
        "type": "string",
        "enum": ["vanilla-js", "react", "matplotlib", "plotly", "auto"],
        "description": "Framework preference"
      }
    },
    "required": ["concept"]
  }
  ```

### Step 2: Create Assistant

Go to **Assistants** section and create a new assistant:

#### Basic Configuration
- **Name**: `AI Learning Assistant`
- **Description**: `Voice-powered educational content generator`

#### Model Configuration
- **Provider**: `OpenAI`
- **Model**: `gpt-4o`
- **Temperature**: `0.7`
- **Max Tokens**: `1000`

#### System Prompt
```
You are an AI learning assistant with voice capabilities. You help students and educators by generating educational content through voice interaction.

You have access to the following tools:

1. **generateSummary**: Use when users ask for summaries, lesson plans, or course overviews
   - Examples: "Create a summary of photosynthesis", "Make a lesson plan for algebra"
   
2. **generateQuiz**: Use when users ask for quizzes, tests, or practice questions
   - Examples: "Generate a quiz on calculus", "Create practice problems for chemistry"
   
3. **generateDiagram**: Use when users ask for visual explanations or diagrams
   - Examples: "Show me a diagram of the water cycle", "Create a flowchart for programming"
   
4. **generateWebpage**: Use when users ask for interactive content or simulations
   - Examples: "Create a physics simulation", "Build an interactive calculator"

Always confirm what type of content you're generating and ask for clarification if the request is ambiguous. Be encouraging and educational in your responses.

When a tool is successfully executed, let the user know that the content has been generated and will appear as a new tab in their learning interface.
```

#### Voice Configuration
- **Provider**: Choose your preferred voice provider (ElevenLabs, OpenAI, etc.)
- **Voice**: Select an appropriate educational voice
- **Speed**: `1.0`

#### Tools
Add all four tools you created earlier:
- Generate Summary
- Generate Quiz  
- Generate Diagram
- Generate Webpage

**Important**: Make sure each tool's Server URL points to your webhook endpoint:
- For local development: `https://your-ngrok-url.ngrok.io/api/vapi-tools`
- For production: `https://your-domain.com/api/vapi-tools`

#### Server Messages
Enable "Server Messages" in your assistant configuration to receive tool call webhooks.

### Step 3: Configure Tool Messages (Optional)

For each tool, you can customize the messages:

#### Request Start Messages
- **Generate Summary**: "Let me create that educational content for you..."
- **Generate Quiz**: "I'm generating a quiz on that topic..."
- **Generate Diagram**: "Creating a visual diagram to help explain this..."
- **Generate Webpage**: "Building an interactive demonstration..."

#### Request Complete Messages
- **Generate Summary**: "I've created the educational content and it's now available as a new tab!"
- **Generate Quiz**: "Your quiz is ready! You can find it in a new tab."
- **Generate Diagram**: "The diagram has been generated and added to your workspace."
- **Generate Webpage**: "Your interactive content is ready to explore!"

#### Request Failed Messages
- "I'm having trouble generating that content right now. Please try again."

## Testing the Setup

1. **Start your development server**: `npm run dev`
2. **Set up ngrok or similar** to expose your local server for Vapi webhooks
3. **Update the Server URL** in your Vapi tools to point to your public endpoint
4. **Test the voice assistant** by clicking the microphone button and saying:
   - "Create a summary of photosynthesis"
   - "Generate a quiz on JavaScript basics"
   - "Show me a diagram of the solar system"
   - "Build an interactive physics simulation"

## Deployment Notes

When deploying to production:

1. **Update Server URLs** in Vapi tools to your production domain
2. **Set environment variables** in your hosting platform
3. **Test all tool integrations** in the production environment

## Troubleshooting

### Common Issues

1. **"Tool call failed"**: Check that your API endpoint is accessible and returning the correct format
2. **"Environment Setup Required"**: Ensure `NEXT_PUBLIC_VAPI_PUBLIC_KEY` is set correctly
3. **"Assistant not responding"**: Verify your assistant ID matches the one in your environment variables
4. **"Content not appearing"**: Check browser console for errors in tool call handling

### Debug Logs

Check the browser console and server logs for detailed error messages. The system logs all tool calls and responses for debugging.

## API Endpoint Format

Your `/api/vapi-tools` endpoint expects this format:

```json
{
  "message": {
    "type": "tool-calls",
    "toolCallList": [
      {
        "id": "call_123",
        "name": "generateSummary",
        "arguments": {
          "concept": "photosynthesis",
          "type": "concept"
        }
      }
    ]
  }
}
```

And returns:

```json
{
  "results": [
    {
      "toolCallId": "call_123",
      "result": {
        "success": true,
        "content": "Generated content...",
        "contentType": "summary"
      }
    }
  ]
}
``` 