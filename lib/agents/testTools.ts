import { tool } from 'ai';
import { z } from 'zod';

/**
 * Simple test tools for multi-step proof of concept
 * These tools have execute functions and just log to console
 */

export const stepOneTool = tool({
  description: 'Execute step one of a multi-step process',
  parameters: z.object({
    message: z.string().describe('A message to process in step one'),
  }),
  execute: async ({ message }) => {
    console.log('🟢 STEP ONE EXECUTED:', message);
    const result = {
      stepNumber: 1,
      processedMessage: `Step 1 processed: ${message}`,
      nextStepData: `data-from-step-1-${Date.now()}`
    };
    console.log('🟢 STEP ONE RESULT:', result);
    return result;
  },
});

export const stepTwoTool = tool({
  description: 'Execute step two of a multi-step process',
  parameters: z.object({
    previousData: z.string().describe('Data from the previous step'),
    action: z.string().describe('What action to perform in step two'),
  }),
  execute: async ({ previousData, action }) => {
    console.log('🔵 STEP TWO EXECUTED:', { previousData, action });
    const result = {
      stepNumber: 2,
      previousData,
      actionPerformed: action,
      nextStepData: `data-from-step-2-${Date.now()}`
    };
    console.log('🔵 STEP TWO RESULT:', result);
    return result;
  },
});

export const stepThreeTool = tool({
  description: 'Execute step three of a multi-step process (final step)',
  parameters: z.object({
    previousData: z.string().describe('Data from the previous step'),
    finalAction: z.string().describe('Final action to complete the process'),
  }),
  execute: async ({ previousData, finalAction }) => {
    console.log('🟡 STEP THREE EXECUTED:', { previousData, finalAction });
    const result = {
      stepNumber: 3,
      previousData,
      finalActionPerformed: finalAction,
      processComplete: true,
      summary: 'Multi-step process completed successfully!'
    };
    console.log('🟡 STEP THREE RESULT:', result);
    return result;
  },
});

export const simpleLogTool = tool({
  description: 'Simple tool that just logs a message',
  parameters: z.object({
    message: z.string().describe('Message to log'),
    level: z.enum(['info', 'success', 'warning', 'error']).describe('Log level'),
  }),
  execute: async ({ message, level }) => {
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[level];
    
    console.log(`${emoji} SIMPLE LOG [${level.toUpperCase()}]:`, message);
    return {
      logged: true,
      message,
      level,
      timestamp: new Date().toISOString()
    };
  },
});
