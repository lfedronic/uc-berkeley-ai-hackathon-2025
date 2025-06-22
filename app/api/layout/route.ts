import { NextRequest, NextResponse } from 'next/server';
import { executeLayoutOperation } from '@/lib/agents/layoutAgent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instruction, context } = body;

    if (!instruction) {
      return NextResponse.json(
        { error: 'Instruction is required' },
        { status: 400 }
      );
    }

    const result = await executeLayoutOperation({
      instruction,
      context
    });

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('Layout API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute layout operation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Layout Management API',
    endpoints: {
      POST: 'Execute layout operations with AI agent',
    },
    availableVerbs: [
      'split', 'resize', 'remove', 'assign', 'addTab', 
      'activateTab', 'closeTab', 'moveTab', 'setLayout', 'getEnv'
    ]
  });
}
