import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

export interface SummaryRequest {
  concept?: string;
  topic?: string;
  type: 'concept' | 'lesson-plan' | 'course-overview';
}

export async function generateSummary(request: SummaryRequest): Promise<string> {
  const { concept, topic, type } = request;

  let prompt = '';
  
  switch (type) {
    case 'concept':
      prompt = `Create a comprehensive summary and lesson plan for the concept: "${concept || topic}".
      
Please structure your response in markdown format with the following sections:
# ${concept || topic}

## Overview
Brief introduction to the concept

## Key Points
- Main concepts and principles
- Important definitions
- Core ideas to understand

## Detailed Explanation
In-depth explanation with examples

## Learning Objectives
What students should be able to do after learning this

## Practice Questions
3-5 questions to test understanding

## Additional Resources
Suggested further reading or practice

Make it educational, engaging, and suitable for learning.`;
      break;
      
    case 'lesson-plan':
      prompt = `Create a complete lesson plan for: "${concept || topic}".
      
Please structure your response in markdown format with the following sections:
# Lesson Plan: ${concept || topic}

## Course Information
- **Subject**: [Subject Area]
- **Duration**: [Estimated time]
- **Level**: [Beginner/Intermediate/Advanced]

## Learning Objectives
By the end of this lesson, students will be able to:

## Prerequisites
What students should know before starting

## Lesson Structure
### Introduction (5-10 minutes)
### Main Content (20-30 minutes)
### Activities/Examples (15-20 minutes)
### Assessment/Review (5-10 minutes)

## Materials Needed
List of resources and tools

## Assessment Criteria
How to measure student understanding

## Homework/Follow-up
Additional practice or preparation for next lesson

Make it practical and ready to use for teaching.`;
      break;
      
    case 'course-overview':
      prompt = `Create a comprehensive course overview and curriculum for: "${concept || topic}".
      
Please structure your response in markdown format with the following sections:
# Course: ${concept || topic}

## Course Description
Brief overview of what the course covers

## Course Objectives
What students will achieve by completing this course

## Prerequisites
Required knowledge or skills

## Course Structure
### Module 1: [Title]
- Lesson 1.1: [Topic]
- Lesson 1.2: [Topic]
### Module 2: [Title]
- Lesson 2.1: [Topic]
- Lesson 2.2: [Topic]
### Module 3: [Title]
- Lesson 3.1: [Topic]
- Lesson 3.2: [Topic]

## Assessment Methods
How students will be evaluated

## Timeline
Suggested schedule for completion

## Resources
Required and recommended materials

Make it comprehensive and well-organized for a complete learning experience.`;
      break;
  }

  try {
    const result = await generateText({
      model: google('gemini-1.5-flash'),
      prompt,
      maxTokens: 2000,
      temperature: 0.7,
    });

    return result.text;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error('Failed to generate summary');
  }
}
