import { NextRequest, NextResponse } from 'next/server';
import { processDeskView, getOpenAiTTS } from '@/lib/agents/deskViewAgent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, task, prompt, customPrompt } = body;

    if (!image || !task) {
      return NextResponse.json(
        { error: 'Image and task are required' },
        { status: 400 }
      );
    }

    // 1. Get the text analysis from the desk view agent
    const analysisResult = await processDeskView({
      image,
      task,
      prompt,
      customPrompt
    });

    // 2. If analysis was successful, generate audio from the text
    let audioContent: string | null = null;
    if (analysisResult.analysis) {
      try {
        audioContent = await getOpenAiTTS(analysisResult.analysis);
      } catch (ttsError) {
        console.error("OpenAI TTS generation failed, returning response without audio.", ttsError);
        // We'll still return the text analysis even if TTS fails
      }
    }
    
    // 3. Return both text analysis and audio content
    return NextResponse.json({ 
      ...analysisResult,
      audio: audioContent 
    });

  } catch (error) {
    console.error('Error in deskview API:', error);
    return NextResponse.json(
      { error: 'Failed to process desk view' },
      { status: 500 }
    );
  }
} 