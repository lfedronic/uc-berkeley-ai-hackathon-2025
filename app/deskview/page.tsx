'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function DeskViewPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const screenshotRef = useRef<HTMLImageElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [autoCaptureInterval, setAutoCaptureInterval] = useState<NodeJS.Timeout | null>(null);

  // Real DeskView Agent API call
  async function processDeskView(request: any) {
    try {
      const response = await fetch('/api/deskview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calling deskview API:', error);
      throw error;
    }
  }

  async function getCameraDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');

    console.log("Available video devices:", videoDevices);

    if (selectRef.current) {
      selectRef.current.innerHTML = '';
      if (videoDevices.length === 0) {
        const option = document.createElement('option');
        option.text = "No cameras found";
        option.disabled = true;
        selectRef.current.appendChild(option);
        return;
      }
      videoDevices.forEach(device => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.text = device.label || `Camera ${selectRef.current!.length + 1}`;
        selectRef.current!.appendChild(option);
      });
    }
  }

  async function startStream(deviceId?: string) {
    try {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId ? { deviceId: { exact: deviceId } } : true
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCurrentStream(stream);
    } catch (err) {
      console.error('❌ Error accessing camera:', err);
    }
  }

  function takeScreenshot() {
    if (!currentStream || !videoRef.current || isCapturing) return;
    
    setIsCapturing(true);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg');
    
    console.log('📸 Screenshot taken:', imageData.substring(0, 50) + '...');
    
    analyzeImage(imageData);
  }

  async function analyzeImage(imageData: string) {
    try {
      if (analysisRef.current) {
        analysisRef.current.innerHTML = '<span class="text-gray-500 italic">🤖 Analyzing your work...</span>';
      }
      
      const result = await processDeskView({
        image: imageData,
        task: 'analyze'
      });
      
      if (analysisRef.current) {
        analysisRef.current.textContent = result.analysis;
      }

      // Play the audio if it exists
      if (result.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${result.audio}`);
        audio.play().catch(e => console.error("Audio playback failed:", e));
      }
      
    } catch (error) {
      if (analysisRef.current) {
        analysisRef.current.textContent = `❌ Analysis failed: ${(error as Error).message}`;
      }
    } finally {
        setIsCapturing(false);
    }
  }

  function toggleAutoCapture() {
    if (autoCaptureInterval) {
      clearInterval(autoCaptureInterval);
      setAutoCaptureInterval(null);
      setIsCapturing(false);
    } else {
      takeScreenshot(); // Take one immediately
      const interval = setInterval(takeScreenshot, 10000);
      setAutoCaptureInterval(interval);
    }
  }

  useEffect(() => {
    async function init() {
      await startStream();
      await getCameraDevices();
      if (selectRef.current && selectRef.current.options.length > 0 && selectRef.current.options[0].value) {
        startStream(selectRef.current.value);
      }
    }

    init();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      if (autoCaptureInterval) {
        clearInterval(autoCaptureInterval);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                </svg>
                Back to Home
            </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Live AI Tutor
          </h1>
          <p className="text-lg text-gray-600">
            Get real-time feedback as you work.
          </p>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Left Side: Camera and Controls */}
            <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">Camera Feed</h2>
                
                {/* Camera Select */}
                <div>
                    <label htmlFor="cameraSelect" className="block text-sm font-medium text-gray-700 mb-1">Select Camera</label>
                    <select 
                        id="cameraSelect"
                        ref={selectRef}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onChange={(e) => startStream(e.target.value)}
                        >
                        <option>Loading cameras...</option>
                    </select>
                </div>
              
                {/* Video Player */}
                <div className="bg-black rounded-lg overflow-hidden aspect-video">
                    <video 
                        ref={videoRef}
                        autoPlay 
                        playsInline 
                        muted
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                        onClick={takeScreenshot}
                        disabled={isCapturing}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                        📸 Analyze View
                    </button>
                    
                    <button 
                        onClick={toggleAutoCapture}
                        disabled={autoCaptureInterval ? false : isCapturing}
                        className="bg-gray-700 hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                        {autoCaptureInterval ? '⏹️ Stop Auto' : '🔄 Start Auto'}
                    </button>
                </div>
            </div>

            {/* Right Side: Analysis */}
            <div className="bg-white rounded-2xl shadow-xl p-6 min-h-[200px]">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Tutor Feedback</h2>
                <div 
                    ref={analysisRef}
                    className="prose prose-lg text-gray-700"
                >
                    <p className="text-gray-500 italic">No analysis performed yet. Capture your screen to get started!</p>
                </div>
            </div>
        </div>
        
      </div>
    </div>
  );
} 