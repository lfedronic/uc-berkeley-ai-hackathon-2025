import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filePath, className } = body;

    if (!filePath || !className) {
      return NextResponse.json(
        { error: 'File path and class name are required' },
        { status: 400 }
      );
    }

    // Check if the file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Animation file not found' },
        { status: 404 }
      );
    }

    console.log(`🎬 Running animation: ${filePath} - ${className}`);

    // Run the Manim animation
    const result = await runManimAnimation(filePath, className);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Find the generated video file
    const videoFile = result.outputFiles?.find(file => 
      file.endsWith('.mp4') || file.endsWith('.gif')
    );

    //if (!videoFile) {
    //  return NextResponse.json(
    //    { error: 'No video file generated' },
    //    { status: 500 }
    //  );
    //}

    // Create a URL to serve the video file
    const videoUrl = `/api/animation/video?file=${encodeURIComponent(videoFile)}`;

    return NextResponse.json({
      success: true,
      videoUrl,
      outputFiles: result.outputFiles
    });

  } catch (error) {
    console.error('Animation run API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function runManimAnimation(filePath: string, className: string): Promise<{ success: boolean; outputFiles?: string[]; error?: string }> {
  return new Promise((resolve, reject) => {
    const manimProcess = spawn('python3', ['-m', 'manim', '-pql', filePath, className], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    manimProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    manimProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    manimProcess.on('close', (code) => {
      if (code === 0) {
        // Extract output file paths from stdout
        const outputFiles = extractOutputFiles(stdout);
        resolve({ success: true, outputFiles });
      } else {
        resolve({ 
          success: false, 
          error: `Manim failed with code ${code}: ${stderr}` 
        });
      }
    });

    manimProcess.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
  });
}

function extractOutputFiles(stdout: string): string[] {
  const fileMatches = stdout.match(/Rendered (.+\.(mp4|gif|png))/g);
  if (!fileMatches) return [];
  
  return fileMatches.map(match => {
    const fileMatch = match.match(/Rendered (.+\.(mp4|gif|png))/);
    return fileMatch ? fileMatch[1] : '';
  }).filter(Boolean);
} 