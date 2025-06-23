import { NextRequest, NextResponse } from 'next/server';
import { generateAnimation, validateAnimationQuery, getAnimationTemplates, getAnimationStats } from '@/lib/agents/animationAgent';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 API Debug: POST request received');
    const body = await request.json();
    console.log('🔧 API Debug: Request body parsed:', body);
    const { query, model, autoRun, outputFormat } = body;

    if (!query) {
      console.log('🔧 API Debug: Query is missing');
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log('🔧 API Debug: Query validation starting...');
    // Validate the query
    const validation = await validateAnimationQuery(query);
    console.log('🔧 API Debug: Query validation result:', validation);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error, suggestions: validation.suggestions },
        { status: 400 }
      );
    }

    console.log('🔧 API Debug: About to call generateAnimation...');
    // Generate the animation
    const result = await generateAnimation({
      query,
      model: model || 'gemini',
      autoRun: autoRun || false,
      outputFormat: outputFormat || 'python'
    });
    console.log('🔧 API Debug: generateAnimation completed, result:', result);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Animation API error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'templates':
        const templates = await getAnimationTemplates();
        return NextResponse.json({ templates });

      case 'stats':
        const stats = await getAnimationStats();
        return NextResponse.json(stats);

      case 'validate':
        const query = searchParams.get('query');
        if (!query) {
          return NextResponse.json(
            { error: 'Query parameter is required for validation' },
            { status: 400 }
          );
        }
        const validation = await validateAnimationQuery(query);
        return NextResponse.json(validation);

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: templates, stats, or validate' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Animation API GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 