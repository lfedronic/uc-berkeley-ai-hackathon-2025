'use client';

import React, { useState, useEffect, useRef } from 'react';
import Vapi from '@vapi-ai/web';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { GeneratedQuiz } from '@/lib/agents/quizAgent';
import { GeneratedDiagram } from '@/lib/agents/diagramAgent';
import { GeneratedWebpage } from '@/lib/agents/webpageAgent';

interface VoiceChatAgentProps {
  onLessonUpdate?: (content: string) => void;
  onQuizUpdate?: (quiz: GeneratedQuiz) => void;
  onDiagramUpdate?: (diagram: GeneratedDiagram) => void;
  onWebpageUpdate?: (webpage: GeneratedWebpage) => void;
}

interface TranscriptMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  toolCall?: string;
}

export default function VoiceChatAgent({
  onLessonUpdate,
  onQuizUpdate,
  onDiagramUpdate,
  onWebpageUpdate,
}: VoiceChatAgentProps) {
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [error, setError] = useState('');
  const [isMinimized, setIsMinimized] = useState(true);
  const [, setProcessedMessageIds] = useState<Set<string>>(new Set());

  // Environment variables
  const apiKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '';
  const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || '9c402506-cad6-4687-a4f5-ea751472ccf9';
  const isConfigured = !!apiKey;

  // Refs for auto-scroll and SSE connection
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<EventSource | null>(null);
  const clientIdRef = useRef<string>(`client-${Date.now()}`);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!isMinimized) {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript, isMinimized]);

  // SSE connection for receiving tool results
  useEffect(() => {
    if (!isConfigured) return;

    const connectSSE = () => {
      console.log('🔌 Connecting to SSE for tool results...');
      
      const eventSource = new EventSource(`/api/vapi-tools?clientId=${clientIdRef.current}`);
      sseRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('✅ SSE connection opened');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Received SSE message:', data);
          
          if (data.type === 'tool-result') {
            console.log('🔧 Processing tool result from SSE:', data.data);
            handleToolCallResult(data.data);
          } else if (data.type === 'connected') {
            console.log('🔌 SSE connected with client ID:', data.clientId);
          }
        } catch (error) {
          console.error('❌ Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ SSE connection error:', error);
        // Reconnect after a delay
        setTimeout(() => {
          if (sseRef.current?.readyState === EventSource.CLOSED) {
            connectSSE();
          }
        }, 5000);
      };
    };

    connectSSE();

    return () => {
      if (sseRef.current) {
        console.log('🔌 Closing SSE connection');
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, [isConfigured]);

  // Initialize Vapi instance
  useEffect(() => {
    if (!apiKey || !isConfigured) return;

    try {
      const vapiInstance = new Vapi(apiKey);
      setVapi(vapiInstance);
      setError('');

      // Event listeners
      vapiInstance.on('call-start', () => {
        console.log('🎙️ Voice call started');
        setIsConnected(true);
        setError('');
        addToolCallMessage('Voice assistant connected and ready!');
      });

      vapiInstance.on('call-end', () => {
        console.log('🎙️ Voice call ended');
        setIsConnected(false);
        setIsSpeaking(false);
        setIsListening(false);
        
        // Add a message to transcript about call ending
        addToolCallMessage('Voice call ended');
      });

      vapiInstance.on('speech-start', () => {
        console.log('🗣️ Assistant started speaking');
        setIsSpeaking(true);
        setIsListening(false);
      });

      vapiInstance.on('speech-end', () => {
        console.log('👂 Assistant stopped speaking, listening...');
        setIsSpeaking(false);
        setIsListening(true);
      });

      vapiInstance.on('message', (message: unknown) => {
        console.log('📨 Received Vapi message:', message);
        handleVapiMessage(message);
      });

      vapiInstance.on('error', (error: unknown) => {
        console.error('❌ Vapi error:', error);
        console.error('❌ Vapi error type:', typeof error);
        console.error('❌ Vapi error stringified:', JSON.stringify(error, null, 2));
        
        const errorMsg = error as { message?: string; type?: string; code?: string };
        let errorText = 'Unknown error';
        
        if (errorMsg.message) {
          errorText = errorMsg.message;
        } else if (typeof error === 'string') {
          errorText = error;
        } else if (error && typeof error === 'object') {
          errorText = JSON.stringify(error);
        }
        
        // Check for specific error types
        if (errorText.includes('ejection') || errorText.includes('Meeting has ended')) {
          errorText = 'Call ended unexpectedly - this might be due to webhook timeout or error';
          addToolCallMessage('⚠️ Call ended during tool execution - check webhook logs');
        } else if (errorText.includes('timeout')) {
          errorText = 'Connection timeout - webhook might be taking too long';
          addToolCallMessage('⚠️ Webhook timeout detected');
        }
        
        setError(`Error: ${errorText}`);
        setIsConnected(false);
        setIsSpeaking(false);
        setIsListening(false);
        
        // Add error to transcript
        addToolCallMessage(`Error occurred: ${errorText}`);
      });

      // Add more event listeners for debugging
      vapiInstance.on('call-start', () => {
        console.log('🎙️ Call start event');
      });

      vapiInstance.on('volume-level', (level: number) => {
        // Only log occasionally to avoid spam
        if (Math.random() < 0.01) {
          console.log('🔊 Volume level:', level);
        }
      });



      return () => {
        vapiInstance?.stop();
      };
    } catch (err: unknown) {
      const errorMsg = err as { message?: string };
      setError(`Failed to initialize Vapi: ${errorMsg.message}`);
    }
  }, [apiKey, isConfigured]);

  const handleVapiMessage = (message: unknown) => {
    console.log('📨 Raw Vapi message:', message);
    
    const msg = message as {
      type: string;
      role?: string;
      transcript?: string;
      transcriptId?: string;
      toolCalls?: Array<{
        id: string;
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };

    // Handle transcript messages
    if (msg.type === 'transcript' && msg.transcript && msg.role) {
      const messageId = msg.transcriptId || `${msg.role}-${msg.transcript}-${Date.now()}`;
      
      setProcessedMessageIds((prevIds) => {
        if (prevIds.has(messageId)) {
          return prevIds;
        }

        const newIds = new Set(prevIds);
        newIds.add(messageId);

        if (newIds.size > 100) {
          const idsArray = Array.from(newIds);
          const recentIds = idsArray.slice(-100);
          return new Set(recentIds);
        }

        return newIds;
      });

      setTranscript((prev) => {
        const isDuplicate = prev.some(
          (existingMsg) =>
            existingMsg.role === msg.role &&
            existingMsg.text === msg.transcript &&
            Math.abs(existingMsg.timestamp.getTime() - Date.now()) < 1000
        );

        if (isDuplicate) {
          return prev;
        }

        return [
          ...prev,
          {
            role: msg.role as 'user' | 'assistant',
            text: msg.transcript!, // We already checked that transcript exists
            timestamp: new Date(),
          },
        ];
      });
    }

    // Handle tool calls - this is when the assistant wants to call a tool
    if (msg.type === 'tool-calls' && msg.toolCalls) {
      console.log('🔧 Tool calls detected:', msg.toolCalls);
      addToolCallMessage('Processing tool calls via webhook...');
      
      // The tool calls will be handled by Vapi automatically via the webhook
      // We'll get the results back via SSE
    }

    // Log any unhandled message types
    if (!['transcript', 'tool-calls'].includes(msg.type)) {
      console.log('🔍 Unhandled message type:', msg.type, msg);
    }
  };

  const handleToolCallResult = (result: unknown) => {
    try {
      console.log('🔧 Raw tool call result from SSE:', result);
      
      const toolResult = result as {
        success?: boolean;
        contentType?: string;
        content?: string;
        quiz?: GeneratedQuiz;
        diagram?: GeneratedDiagram;
        webpage?: GeneratedWebpage;
        concept?: string;
        error?: string;
      };

      console.log('🔧 Parsed tool call result:', toolResult);

      if (toolResult.success) {
        console.log('✅ Tool call successful, content type:', toolResult.contentType);
        
        switch (toolResult.contentType) {
          case 'summary':
            if (toolResult.content) {
              console.log('📝 Calling onLessonUpdate with content length:', toolResult.content.length);
              onLessonUpdate?.(toolResult.content);
              addToolCallMessage(`Generated summary for "${toolResult.concept}" - New tab created!`);
            } else {
              console.warn('⚠️ Summary result missing content');
            }
            break;
          case 'quiz':
            if (toolResult.quiz) {
              console.log('🧠 Calling onQuizUpdate with quiz:', toolResult.quiz.title);
              onQuizUpdate?.(toolResult.quiz);
              addToolCallMessage(`Generated quiz on "${toolResult.concept}" - New tab created!`);
            } else {
              console.warn('⚠️ Quiz result missing quiz data');
            }
            break;
          case 'diagram':
            if (toolResult.diagram) {
              console.log('📊 Calling onDiagramUpdate with diagram:', toolResult.diagram.title);
              onDiagramUpdate?.(toolResult.diagram);
              addToolCallMessage(`Generated diagram for "${toolResult.concept}" - New tab created!`);
            } else {
              console.warn('⚠️ Diagram result missing diagram data');
            }
            break;
          case 'webpage':
            if (toolResult.webpage) {
              console.log('🌐 Calling onWebpageUpdate with webpage:', toolResult.webpage.title);
              onWebpageUpdate?.(toolResult.webpage);
              addToolCallMessage(`Generated interactive demo for "${toolResult.concept}" - New tab created!`);
            } else {
              console.warn('⚠️ Webpage result missing webpage data');
            }
            break;
          default:
            console.warn('⚠️ Unknown content type:', toolResult.contentType);
            addToolCallMessage(`Generated content but couldn't determine type: ${toolResult.contentType}`);
        }
      } else {
        console.error('❌ Tool call failed:', toolResult.error);
        addToolCallMessage(`Tool call failed: ${toolResult.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error handling tool call result:', error);
      addToolCallMessage(`Error processing tool result: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const addToolCallMessage = (toolCall: string) => {
    setTranscript((prev) => [
      ...prev,
      {
        role: 'assistant',
        text: `✅ ${toolCall}`,
        timestamp: new Date(),
        toolCall,
      },
    ]);
  };

  const startCall = () => {
    if (vapi && assistantId) {
      try {
        vapi.start(assistantId);
        setTranscript([]);
        setProcessedMessageIds(new Set());
        setIsMinimized(false);
      } catch (err: unknown) {
        const errorMsg = err as { message?: string };
        setError(`Failed to start call: ${errorMsg.message}`);
      }
    }
  };

  const endCall = () => {
    if (vapi) {
      vapi.stop();
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isConfigured) {
    return (
      <div className="fixed bottom-6 right-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-sm">
        <div className="text-sm">
          <strong>Voice Assistant Setup Required</strong>
          <p className="mt-1">Add NEXT_PUBLIC_VAPI_PUBLIC_KEY to your .env.local file</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Floating Voice Button */}
      {!isConnected && isMinimized && (
        <button
          onClick={startCall}
          className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 z-50 animate-pulse"
          title="Start Voice Conversation"
        >
          <Mic size={24} />
        </button>
      )}

      {/* Voice Interface */}
      {(isConnected || !isMinimized) && (
        <div className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 transition-all duration-300 ${
          isMinimized ? 'w-16 h-16' : 'w-96 h-[500px]'
        }`}>
          {isMinimized ? (
            // Minimized state
            <button
              onClick={toggleMinimize}
              className={`w-full h-full rounded-2xl flex items-center justify-center transition-colors ${
                isConnected
                  ? isSpeaking
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-green-500 text-white'
                  : 'bg-gray-500 text-white'
              }`}
            >
              {isConnected ? (
                isSpeaking ? <Volume2 size={20} /> : <Mic size={20} />
              ) : (
                <MicOff size={20} />
              )}
            </button>
          ) : (
            // Expanded state
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-purple-600 text-white rounded-t-2xl">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isConnected
                        ? isSpeaking
                          ? 'bg-red-400 animate-pulse'
                          : isListening
                          ? 'bg-green-400 animate-pulse'
                          : 'bg-yellow-400'
                        : 'bg-gray-400'
                    }`}
                  />
                  <span className="font-medium text-sm">
                    {isConnected
                      ? isSpeaking
                        ? 'Speaking...'
                        : isListening
                        ? 'Listening...'
                        : 'Connected'
                      : 'Voice Assistant'}
                  </span>
                </div>
                <button
                  onClick={toggleMinimize}
                  className="text-white/80 hover:text-white"
                >
                  <VolumeX size={16} />
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Transcript */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {transcript.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <Mic className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm">Start speaking to generate educational content!</p>
                    <div className="mt-3 text-xs text-gray-400">
                                           <p>Try: &quot;Create a quiz on photosynthesis&quot;</p>
                     <p>Or: &quot;Show me a diagram of the water cycle&quot;</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {transcript.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                            msg.role === 'user'
                              ? 'bg-purple-600 text-white'
                              : msg.toolCall
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div>{msg.text}</div>
                          <div
                            className={`text-xs mt-1 ${
                              msg.role === 'user'
                                ? 'text-purple-200'
                                : msg.toolCall
                                ? 'text-green-600'
                                : 'text-gray-500'
                            }`}
                          >
                            {formatTime(msg.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={transcriptEndRef} />
                  </>
                )}
              </div>

              {/* Controls */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex justify-center">
                  {!isConnected ? (
                    <button
                      onClick={startCall}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center space-x-2"
                    >
                      <Mic size={16} />
                      <span>Start Voice Chat</span>
                    </button>
                  ) : (
                    <button
                      onClick={endCall}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center space-x-2"
                    >
                      <MicOff size={16} />
                      <span>End Call</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
} 