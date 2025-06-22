import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

export interface AnimationRequest {
  query: string;
  model?: 'gemini' | 'openai';
  autoRun?: boolean;
  outputFormat?: 'python' | 'mp4' | 'gif';
}

export interface AnimationResponse {
  success: boolean;
  pythonCode?: string;
  filePath?: string;
  className?: string;
  error?: string;
  executionTime?: number;
  outputFiles?: string[];
}

export interface AnimationStatus {
  status: 'generating' | 'running' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  output?: AnimationResponse;
}

/**
 * Generate a Manim animation using the rag_pipeline.py script
 */
export async function generateAnimation(request: AnimationRequest): Promise<AnimationResponse> {
  const startTime = Date.now();
  const { query, model = 'gemini', autoRun = false, outputFormat = 'python' } = request;

  try {
    console.log(`🎬 Generating animation for: "${query}"`);

    // Step 1: Create a temporary Python script that calls rag_pipeline with the query
    const tempScriptPath = await createTempScript(query, model);
    
    // Step 2: Execute the Python script
    const result = await executePythonScript(tempScriptPath, query);
    
    // Step 3: Parse the results
    const response = await parseAnimationResult(result, query, model);
    
    // Step 4: Optionally run the generated animation
    if (autoRun && response.success && response.pythonCode) {
      const runResult = await runManimAnimation(response.filePath!, response.className!);
      response.outputFiles = runResult.outputFiles;
    }

    response.executionTime = Date.now() - startTime;
    
    // Clean up temporary files
    await cleanupTempFiles(tempScriptPath);
    
    return response;

  } catch (error) {
    console.error('Error generating animation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      executionTime: Date.now() - startTime
    };
  }
}

/**
 * Create a temporary Python script that modifies rag_pipeline.py with the user's query
 */
async function createTempScript(query: string, model: string): Promise<string> {
  const tempDir = path.join(process.cwd(), 'test', 'temp');
  const tempScriptPath = path.join(tempDir, `animation_${Date.now()}.py`);
  
  // Read the original rag_pipeline.py
  const originalScript = await readFile('test/rag_pipeline.py', 'utf-8');
  
  // Add command line argument parsing at the top of the script
  const importSection = `import os, json, requests
from bs4 import BeautifulSoup
from pathlib import Path
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from google import genai
from google.genai import types
from dotenv import load_dotenv
from pathlib import Path
from bs4 import BeautifulSoup
import subprocess
import re
from openai import OpenAI
import sys

# Parse command line arguments
if len(sys.argv) > 1:
    USER_QUERY = sys.argv[1]
else:
    USER_QUERY = "What is merge sort?"  # Default fallback

print(f"🎬 Generating animation for: {USER_QUERY}")

`;

  // Replace the original imports and USER_QUERY definition
  const modifiedScript = originalScript.replace(
    /import os, json, requests[\s\S]*?USER_QUERY = ".*?"/,
    importSection
  );
  
  // Ensure temp directory exists
  if (!existsSync(tempDir)) {
    await mkdir(tempDir, { recursive: true });
  }
  await writeFile(tempScriptPath, modifiedScript);
  
  return tempScriptPath;
}

/**
 * Execute the Python script and capture output
 */
async function executePythonScript(scriptPath: string, query: string): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python3', [scriptPath, query], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      resolve({ stdout, stderr, code: code || 0 });
    });

    pythonProcess.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Parse the output from the Python script
 */
async function parseAnimationResult(
  result: { stdout: string; stderr: string; code: number },
  query: string,
  model: string
): Promise<AnimationResponse> {
  if (result.code !== 0) {
    return {
      success: false,
      error: `Python script failed with code ${result.code}: ${result.stderr}`
    };
  }

  // Extract the generated file path from stdout
  const fileMatch = result.stdout.match(/✅ Manim animation code saved to: (.+)/);
  if (!fileMatch) {
    return {
      success: false,
      error: 'Could not find generated file path in output'
    };
  }

  const filePath = fileMatch[1];
  
  try {
    // Read the generated Python code
    const pythonCode = await readFile(filePath, 'utf-8');
    
    // Extract class name from the code
    const classMatch = pythonCode.match(/class\s+(\w+)\s*\(/);
    const className = classMatch ? classMatch[1] : undefined;

    return {
      success: true,
      pythonCode,
      filePath,
      className
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to read generated file: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Run the generated Manim animation
 */
async function runManimAnimation(filePath: string, className: string): Promise<{ success: boolean; outputFiles?: string[]; error?: string }> {
  return new Promise((resolve, reject) => {
    const manimProcess = spawn('python3', ['-m', 'manim', '-pql', filePath, className], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
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

/**
 * Extract output file paths from Manim stdout
 */
function extractOutputFiles(stdout: string): string[] {
  const fileMatches = stdout.match(/Rendered (.+\.(mp4|gif|png))/g);
  if (!fileMatches) return [];
  
  return fileMatches.map(match => {
    const fileMatch = match.match(/Rendered (.+\.(mp4|gif|png))/);
    return fileMatch ? fileMatch[1] : '';
  }).filter(Boolean);
}

/**
 * Clean up temporary files
 */
async function cleanupTempFiles(tempScriptPath: string): Promise<void> {
  try {
    await unlink(tempScriptPath);
  } catch (error) {
    console.warn('Failed to clean up temporary file:', error);
  }
}

/**
 * Get animation generation status (for long-running operations)
 */
export async function getAnimationStatus(jobId: string): Promise<AnimationStatus> {
  // This could be implemented with a job queue system
  // For now, return a simple status
  return {
    status: 'completed',
    progress: 100,
    message: 'Animation generation completed'
  };
}

/**
 * List available animation templates or examples
 */
export async function getAnimationTemplates(): Promise<string[]> {
  return [
    "What is merge sort?",
    "How does bubble sort work?",
    "Explain matrix multiplication",
    "What is the x-y plane?",
    "Show me a DNA double helix",
    "Demonstrate binary search",
    "Visualize a linked list",
    "Show graph traversal algorithms"
  ];
}

/**
 * Validate if a query is suitable for animation generation
 */
export async function validateAnimationQuery(query: string): Promise<{ valid: boolean; suggestions?: string[]; error?: string }> {
  if (!query || query.trim().length < 3) {
    return {
      valid: false,
      error: 'Query must be at least 3 characters long'
    };
  }

  if (query.length > 200) {
    return {
      valid: false,
      error: 'Query is too long (max 200 characters)'
    };
  }

  // Check if query contains animation-friendly keywords
  const animationKeywords = [
    'sort', 'algorithm', 'data structure', 'graph', 'tree', 'matrix', 'vector',
    'function', 'equation', 'geometry', 'physics', 'chemistry', 'biology',
    'process', 'flow', 'diagram', 'visualization', 'animation', 'show', 'demonstrate'
  ];

  const hasAnimationKeywords = animationKeywords.some(keyword => 
    query.toLowerCase().includes(keyword)
  );

  if (!hasAnimationKeywords) {
    return {
      valid: true,
      suggestions: [
        'Try adding words like "show", "demonstrate", or "visualize"',
        'Consider specifying what you want to animate',
        'Use terms like "algorithm", "process", or "diagram"'
      ]
    };
  }

  return { valid: true };
}

/**
 * Get animation generation statistics
 */
export async function getAnimationStats(): Promise<{
  totalGenerated: number;
  successRate: number;
  averageGenerationTime: number;
  popularQueries: string[];
}> {
  // This would typically query a database
  // For now, return mock data
  return {
    totalGenerated: 42,
    successRate: 0.85,
    averageGenerationTime: 15000, // milliseconds
    popularQueries: [
      "What is merge sort?",
      "How does bubble sort work?",
      "Explain matrix multiplication"
    ]
  };
} 