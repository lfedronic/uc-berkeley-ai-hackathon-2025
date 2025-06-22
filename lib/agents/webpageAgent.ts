import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

export interface WebpageRequest {
  concept: string;
  type?: 'interactive-html' | 'python-chart' | 'simulation' | 'auto';
  complexity?: 'simple' | 'detailed' | 'comprehensive';
  framework?: 'vanilla-js' | 'react' | 'matplotlib' | 'plotly' | 'auto';
}

export interface GeneratedWebpage {
  title: string;
  concept: string;
  type: 'interactive-html' | 'python-chart' | 'simulation';
  framework: string;
  code: string;
  description: string;
  instructions: string;
}

export async function generateWebpage(request: WebpageRequest): Promise<GeneratedWebpage> {
  const { concept, type = 'auto', complexity = 'detailed' } = request;

  const prompt = `Create a custom educational webpage or visualization for the concept: "${concept}".

REQUIREMENTS:
- Generate complete, functional code that demonstrates the concept interactively
- Choose the most appropriate format${type !== 'auto' ? ` (specifically: ${type})` : ''}
- Make it ${complexity} level complexity
- Include educational explanations and interactive elements
- Ensure code is complete and ready to run
- Focus on visual learning and hands-on exploration

CODE TYPE OPTIONS:

## Interactive HTML (with JavaScript)
- Interactive simulations, animations, or demonstrations
- Educational games or quizzes with custom logic
- Visual explanations with clickable elements
- Real-time calculations or converters
- Step-by-step guided tutorials

## Python Chart/Visualization
- Data visualizations using matplotlib, plotly, or seaborn
- Scientific simulations and modeling
- Statistical demonstrations
- Mathematical function plotting
- Data analysis examples

## Educational Simulations
- Physics simulations (motion, waves, optics)
- Chemistry molecular models
- Biology ecosystem models
- Mathematical concept visualizations
- Computer science algorithm demonstrations

COMPLEXITY LEVELS:
- simple: Basic demonstration with 1-2 interactive elements
- detailed: Multiple interactive features with explanations
- comprehensive: Full educational experience with multiple sections

FRAMEWORK GUIDELINES:
- vanilla-js: Pure HTML/CSS/JavaScript (best for simple interactions)
- react: React components (for complex state management)
- matplotlib: Python plotting (for data visualization)
- plotly: Interactive Python charts (for dynamic visualizations)

EDUCATIONAL FOCUS:
- Include clear explanations of concepts
- Add interactive elements that help understanding
- Provide visual feedback and animations
- Include educational annotations and labels
- Make it engaging and hands-on

Please respond with a JSON object containing:
{
  "title": "Clear title for the educational content",
  "concept": "${concept}",
  "type": "chosen_type (interactive-html|python-chart|simulation)",
  "framework": "chosen_framework",
  "code": "complete functional code here",
  "description": "Brief explanation of what the code demonstrates and how it helps learning",
  "instructions": "How to use/interact with the educational content"
}

EXAMPLE OUTPUTS:

For Interactive HTML:
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Concept Demo</title>
    <style>
        /* Educational styling */
    </style>
</head>
<body>
    <div class="container">
        <h1>Interactive Learning</h1>
        <!-- Interactive elements -->
    </div>
    <script>
        // Educational JavaScript
    </script>
</body>
</html>
\`\`\`

For Python Chart:
\`\`\`python
import matplotlib.pyplot as plt
import numpy as np

# Educational demonstration code
# with clear comments and explanations

plt.figure(figsize=(10, 6))
# Visualization code
plt.title('Educational Concept Visualization')
plt.show()
\`\`\`

Make sure the code is complete, educational, and demonstrates the concept effectively through interaction or visualization.`;

  try {
    const result = await generateText({
      model: google('gemini-1.5-flash'),
      prompt,
      maxTokens: 3000,
      temperature: 0.7,
    });

    // Parse the JSON response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const webpageData = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    if (!webpageData.code || !webpageData.title) {
      throw new Error('Missing required fields in webpage response');
    }

    return {
      title: webpageData.title,
      concept: concept,
      type: webpageData.type || 'interactive-html',
      framework: webpageData.framework || 'vanilla-js',
      code: webpageData.code,
      description: webpageData.description || 'Educational demonstration',
      instructions: webpageData.instructions || 'Interact with the elements to learn about the concept.'
    };

  } catch (error) {
    console.error('Error generating webpage:', error);
    
    // Fallback simple HTML
    return {
      title: `${concept} Interactive Demo`,
      concept: concept,
      type: 'interactive-html',
      framework: 'vanilla-js',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${concept} Demo</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .demo-container { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
        button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <h1>${concept} Interactive Demo</h1>
    <div class="demo-container">
        <p>This is an interactive demonstration of <strong>${concept}</strong>.</p>
        <button onclick="demonstrate()">Click to Learn More</button>
        <div id="result"></div>
    </div>
    <script>
        function demonstrate() {
            document.getElementById('result').innerHTML = 
                '<p>✅ Great! You\'re exploring <strong>${concept}</strong>. This interactive demo helps you understand the concept through hands-on interaction.</p>';
        }
    </script>
</body>
</html>`,
      description: `A simple interactive demonstration of ${concept} with clickable elements and explanations.`,
      instructions: 'Click the button to see the demonstration and learn about the concept interactively.'
    };
  }
} 