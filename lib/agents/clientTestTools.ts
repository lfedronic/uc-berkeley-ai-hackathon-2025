import { tool } from 'ai';
import { z } from 'zod';

/** ------------------------------------------------------------
 *  Client-side test tools (NO execute functions – forwarded)
 *  ----------------------------------------------------------*/
export const clientStepOneTool = tool({
  description: 'Execute step one of a multi-step process (client-side)',
  parameters: z.object({
    message: z.string().describe('A message to process in step one'),
  }),
});

export const clientStepTwoTool = tool({
  description: 'Execute step two of a multi-step process (client-side)',
  parameters: z.object({
    previousData: z.string().describe('Data from the previous step'),
    action: z.string().describe('What action to perform in step two'),
  }),
});

export const clientStepThreeTool = tool({
  description: 'Execute step three of a multi-step process (client-side, final step)',
  parameters: z.object({
    previousData: z.string().describe('Data from the previous step'),
    finalAction: z.string().describe('Final action to complete the process'),
  }),
});

export const clientSimpleLogTool = tool({
  description: 'Simple tool that just logs a message (client-side)',
  parameters: z.object({
    message: z.string().describe('Message to log'),
    level: z.enum(['info', 'success', 'warning', 'error']).describe('Log level'),
  }),
});
