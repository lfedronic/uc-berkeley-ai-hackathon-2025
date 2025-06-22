import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import OpenAI from 'openai';

// Next.js handles .env.local automatically, no need for dotenv
if (!process.env.GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY is not set in the environment variables. Please add it to your .env.local file.');
}

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

export interface DeskViewRequest {
  image: string; // Base64 encoded image or image URL
  prompt?: string;
  task: 'analyze' | 'describe' | 'extract-text' | 'identify-objects' | 'custom';
  customPrompt?: string;
}

export interface DeskViewResponse {
  analysis: string;
  objects?: string[];
  text?: string;
  suggestions?: string[];
}

export async function processDeskView(request: DeskViewRequest): Promise<DeskViewResponse> {
  const { image, prompt, task, customPrompt } = request;

  let systemPrompt = '';
  
  switch (task) {
    case 'analyze':
      systemPrompt = `You are an AI tutor providing spoken feedback. Your entire response must be a single, complete sentence and MAXIMUM 15 words. Example: "That's a great start, try adjusting the verb tense." or "3x + 2 = 11 might need to be reevaluated." Don't give answers so easily, provide hints. You must only comment on things you can see in the CURRENT image.`;
      break;
      
    case 'describe':
      systemPrompt = `Provide a detailed description of this desk view image. Focus on:
- What objects are present
- The arrangement of items
- Any notable features
- The overall scene`;
      break;
      
    case 'extract-text':
      systemPrompt = `Extract and transcribe any text visible in this desk view image. Include:
- Text from documents, papers, or screens
- Handwritten notes
- Labels or signs
- Any other readable text content`;
      break;
      
    case 'identify-objects':
      systemPrompt = `Identify and list all objects visible in this desk view image. For each object, provide:
- Object name/type
- Location in the image
- Any relevant details (brand, color, etc.)`;
      break;
      
    case 'custom':
      systemPrompt = customPrompt || 'Analyze this desk view image based on the provided prompt.';
      break;
  }

  const fullPrompt = prompt ? `${systemPrompt}\n\nAdditional context: ${prompt}` : systemPrompt;

  try {
    const result = await generateText({
      model: google('gemini-2.0-flash'),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: fullPrompt },
            { type: 'image', image: image }
          ]
        }
      ],
      maxTokens: 80,
      temperature: 0.7,
    });

    // Parse the response to extract structured data
    const analysis = result.text;
    
    // Try to extract objects and text from the response
    const objects = extractObjects(analysis);
    const text = extractText(analysis);
    const suggestions = extractSuggestions(analysis);

    return {
      analysis,
      objects,
      text,
      suggestions,
    };
  } catch (error) {
    console.error('Error processing desk view:', error);
    throw new Error('Failed to process desk view image');
  }
}

// Helper functions to parse the response
function extractObjects(analysis: string): string[] {
  const objectMatches = analysis.match(/(?:object|item|thing):\s*([^,\n]+)/gi);
  return objectMatches ? objectMatches.map(match => match.replace(/^(?:object|item|thing):\s*/i, '').trim()) : [];
}

function extractText(analysis: string): string | undefined {
  const textMatches = analysis.match(/(?:text|content|document):\s*([^,\n]+)/gi);
  return textMatches ? textMatches.map(match => match.replace(/^(?:text|content|document):\s*/i, '').trim()).join(' ') : undefined;
}

function extractSuggestions(analysis: string): string[] {
  const suggestionMatches = analysis.match(/(?:suggestion|recommendation|improvement):\s*([^,\n]+)/gi);
  return suggestionMatches ? suggestionMatches.map(match => match.replace(/^(?:suggestion|recommendation|improvement):\s*/i, '').trim()) : [];
}

// Utility function to convert image to base64 if needed
export async function imageToBase64(imageUrl: string): Promise<string> {
  if (imageUrl.startsWith('data:image')) {
    return imageUrl; // Already base64
  }
  
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error('Failed to convert image to base64');
  }
}

// Function to get available cameras
export async function getAvailableCameras(): Promise<MediaDeviceInfo[]> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput');
  } catch (error) {
    throw new Error('Failed to get available cameras');
  }
}

// Function to capture image from webcam/camera with device selection
export async function captureImageFromCamera(deviceId?: string): Promise<string> {
  try {
    const constraints: MediaStreamConstraints = {
      video: deviceId ? { deviceId: { exact: deviceId } } : true
    };
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();
    
    return new Promise((resolve, reject) => {
      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg');
        stream.getTracks().forEach(track => track.stop());
        resolve(imageData);
      };
      video.onerror = reject;
    });
  } catch (error) {
    throw new Error(`Failed to capture image from camera: ${(error as Error).message}`);
  }
}

// --- NEW OpenAI TTS FUNCTION ---
export async function getOpenAiTTS(text: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in the environment variables.');
  }
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy", // A standard, friendly voice
      input: text,
      response_format: "mp3",
    });

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    return audioBuffer.toString('base64'); // Return as base64 string
  } catch (error) {
    console.error("Error in getOpenAiTTS:", error);
    throw new Error("Failed to generate speech from text using OpenAI.");
  }
}
