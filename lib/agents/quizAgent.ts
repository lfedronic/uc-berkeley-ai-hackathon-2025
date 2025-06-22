import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'short-answer' | 'true-false' | 'fill-blank';
  question: string;
  options?: string[]; // For MCQ
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

export interface QuizRequest {
  topic: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  questionCount?: number;
  questionTypes?: ('mcq' | 'short-answer' | 'true-false' | 'fill-blank')[];
}

export interface GeneratedQuiz {
  title: string;
  topic: string;
  totalPoints: number;
  estimatedTime: string;
  instructions: string;
  questions: QuizQuestion[];
}

export async function generateQuiz(request: QuizRequest): Promise<GeneratedQuiz> {
  const { 
    topic, 
    difficulty = 'mixed', 
    questionCount = 5,
    questionTypes = ['mcq', 'short-answer', 'true-false']
  } = request;

  const prompt = `Create a comprehensive quiz about "${topic}" with the following specifications:

QUIZ REQUIREMENTS:
- Number of questions: ${questionCount}
- Difficulty level: ${difficulty}
- Question types to include: ${questionTypes.join(', ')}
- Each question should test different aspects of the topic
- Include a mix of conceptual and application-based questions

RESPONSE FORMAT (JSON):
{
  "title": "Quiz title",
  "topic": "${topic}",
  "totalPoints": total_points_number,
  "estimatedTime": "X minutes",
  "instructions": "Clear instructions for taking the quiz",
  "questions": [
    {
      "id": "unique_id",
      "type": "mcq|short-answer|true-false|fill-blank",
      "question": "The question text",
      "options": ["option1", "option2", "option3", "option4"], // Only for MCQ
      "correctAnswer": "correct answer",
      "explanation": "Why this is correct and others are wrong",
      "difficulty": "easy|medium|hard",
      "points": point_value
    }
  ]
}

QUESTION TYPE GUIDELINES:
- MCQ: 4 options, only one correct, make distractors plausible
- Short Answer: Open-ended, 1-3 sentence responses expected
- True/False: Clear statements that are definitively true or false
- Fill in the Blank: Use [BLANK] placeholder in question text

DIFFICULTY GUIDELINES:
- Easy: Basic recall and understanding (1-2 points)
- Medium: Application and analysis (3-4 points)
- Hard: Synthesis and evaluation (5-6 points)

Make sure the quiz is educational, fair, and properly tests understanding of ${topic}.

Return ONLY the JSON object, no additional text.`;

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

    const quizData = JSON.parse(jsonMatch[0]);
    
    // Validate and clean the data
    const quiz: GeneratedQuiz = {
      title: quizData.title || `${topic} Quiz`,
      topic: quizData.topic || topic,
      totalPoints: quizData.totalPoints || quizData.questions?.reduce((sum: number, q: { points?: number }) => sum + (q.points || 1), 0) || questionCount,
      estimatedTime: quizData.estimatedTime || `${Math.ceil(questionCount * 2)} minutes`,
      instructions: quizData.instructions || 'Answer all questions to the best of your ability.',
      questions: quizData.questions?.map((q: Record<string, unknown>, index: number) => ({
        id: q.id || `q${index + 1}`,
        type: q.type || 'mcq',
        question: q.question || '',
        options: q.options || undefined,
        correctAnswer: q.correctAnswer || '',
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'medium',
        points: q.points || 1,
      })) || []
    };

    return quiz;
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw new Error('Failed to generate quiz');
  }
} 