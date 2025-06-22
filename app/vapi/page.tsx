"use client";

import React, { useState, useEffect, useRef } from "react";
import Vapi from "@vapi-ai/web";

interface TranscriptMessage {
	role: "user" | "assistant";
	text: string;
	timestamp: Date;
}

export default function VapiPage() {
	const [vapi, setVapi] = useState<Vapi | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const [isSpeaking, setIsSpeaking] = useState(false);
	const [isListening, setIsListening] = useState(false);
	const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
	const [error, setError] = useState("");
	const [processedMessageIds, setProcessedMessageIds] = useState<Set<string>>(
		new Set()
	);

	// Use environment variables and hardcoded values
	const apiKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "";
	const assistantId = "c2a3d2e2-a744-4be6-b745-6f11708a798b";
	const isConfigured = !!apiKey;

	// Refs for auto-scroll
	const transcriptEndRef = useRef<HTMLDivElement>(null);
	const messagesContainerRef = useRef<HTMLDivElement>(null);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [transcript]);

	// Initialize Vapi instance
	useEffect(() => {
		if (!apiKey || !isConfigured) return;

		try {
			const vapiInstance = new Vapi(apiKey);
			setVapi(vapiInstance);
			setError("");

			// Event listeners
			vapiInstance.on("call-start", () => {
				console.log("Call started");
				setIsConnected(true);
				setError("");
			});

			vapiInstance.on("call-end", () => {
				console.log("Call ended");
				setIsConnected(false);
				setIsSpeaking(false);
				setIsListening(false);
			});

			vapiInstance.on("speech-start", () => {
				console.log("Assistant started speaking");
				setIsSpeaking(true);
				setIsListening(false);
			});

			vapiInstance.on("speech-end", () => {
				console.log("Assistant stopped speaking");
				setIsSpeaking(false);
				setIsListening(true);
			});

			vapiInstance.on("message", (message: unknown) => {
				console.log("Received message:", message);

				const msg = message as {
					type: string;
					role: string;
					transcript: string;
					transcriptId?: string;
				};
				if (msg.type === "transcript" && msg.transcript) {
					// Create a unique ID for this message to prevent duplicates
					const messageId =
						msg.transcriptId || `${msg.role}-${msg.transcript}-${Date.now()}`;

					setProcessedMessageIds((prevIds) => {
						if (prevIds.has(messageId)) {
							return prevIds; // Skip if already processed
						}

						const newIds = new Set(prevIds);
						newIds.add(messageId);

						// Keep only the last 100 message IDs to prevent memory leaks
						if (newIds.size > 100) {
							const idsArray = Array.from(newIds);
							const recentIds = idsArray.slice(-100);
							return new Set(recentIds);
						}

						return newIds;
					});

					setTranscript((prev) => {
						// Double-check for duplicates based on content and timestamp
						const isDuplicate = prev.some(
							(existingMsg) =>
								existingMsg.role === msg.role &&
								existingMsg.text === msg.transcript &&
								Math.abs(existingMsg.timestamp.getTime() - Date.now()) < 1000 // Within 1 second
						);

						if (isDuplicate) {
							return prev;
						}

						return [
							...prev,
							{
								role: msg.role as "user" | "assistant",
								text: msg.transcript,
								timestamp: new Date(),
							},
						];
					});
				}
			});

			vapiInstance.on("error", (error: unknown) => {
				console.error("Vapi error:", error);
				const errorMsg = error as { message?: string };
				setError(`Error: ${errorMsg.message || error}`);
				setIsConnected(false);
				setIsSpeaking(false);
				setIsListening(false);
			});

			return () => {
				vapiInstance?.stop();
			};
		} catch (err: unknown) {
			const errorMsg = err as { message?: string };
			setError(`Failed to initialize Vapi: ${errorMsg.message}`);
		}
	}, [apiKey, isConfigured]);

	const startCall = () => {
		if (vapi && assistantId) {
			try {
				vapi.start(assistantId);
				setTranscript([]);
				setProcessedMessageIds(new Set()); // Clear processed messages on new call
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

	const clearTranscript = () => {
		setTranscript([]);
	};

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	};

	// Show setup message if API key is not configured
	if (!isConfigured) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-8">
				<div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
					<div className="text-center mb-8">
						<div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<svg
								className="w-8 h-8 text-purple-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
								/>
							</svg>
						</div>
						<h1 className="text-3xl font-bold text-gray-900 mb-2">
							Vapi Voice Assistant
						</h1>
						<p className="text-gray-600">Environment Setup Required</p>
					</div>

					<div className="p-4 bg-yellow-50 rounded-lg">
						<h3 className="text-sm font-medium text-yellow-900 mb-2">
							Setup Instructions:
						</h3>
						<ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
							<li>
								Add your Vapi public API key to your .env file as
								NEXT_PUBLIC_VAPI_PUBLIC_KEY
							</li>
							<li>Restart your development server</li>
							<li>Return to this page to start your voice conversation</li>
						</ol>
					</div>
				</div>
			</div>
		);
	}

	// Main voice interface
	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-4xl mx-auto">
					{/* Header */}
					<div className="text-center mb-8">
						<h1 className="text-4xl font-bold text-gray-900 mb-2">
							Voice Assistant
						</h1>
						<p className="text-gray-600">
							Have a natural conversation with your AI assistant
						</p>
					</div>

					{/* Voice Interface Card */}
					<div className="bg-white rounded-2xl shadow-xl overflow-hidden">
						{/* Status Bar */}
						<div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<div
										className={`w-3 h-3 rounded-full ${
											isConnected
												? isSpeaking
													? "bg-red-400 animate-pulse"
													: isListening
													? "bg-green-400 animate-pulse"
													: "bg-yellow-400"
												: "bg-gray-400"
										}`}
									></div>
									<span className="text-white font-medium">
										{isConnected
											? isSpeaking
												? "Assistant Speaking..."
												: isListening
												? "Listening..."
												: "Connected"
											: "Disconnected"}
									</span>
								</div>
								<div className="flex items-center space-x-2">
									<button
										onClick={clearTranscript}
										disabled={!isConnected || transcript.length === 0}
										className="text-white/80 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
										title="Clear transcript"
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
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											/>
										</svg>
									</button>
									<button
										onClick={() => setIsConfigured(false)}
										className="text-white/80 hover:text-white"
										title="Reconfigure"
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
												d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
											/>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
											/>
										</svg>
									</button>
								</div>
							</div>
						</div>

						{/* Error Display */}
						{error && (
							<div className="bg-red-50 border-l-4 border-red-400 p-4">
								<div className="flex">
									<svg
										className="h-5 w-5 text-red-400"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fillRule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
											clipRule="evenodd"
										/>
									</svg>
									<div className="ml-3">
										<p className="text-sm text-red-800">{error}</p>
									</div>
								</div>
							</div>
						)}

						{/* Transcript */}
						<div
							className="h-96 overflow-y-auto p-6"
							ref={messagesContainerRef}
						>
							{transcript.length === 0 ? (
								<div className="h-full flex items-center justify-center text-gray-500">
									<div className="text-center">
										<svg
											className="w-16 h-16 text-gray-300 mx-auto mb-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
											/>
										</svg>
										<p className="text-lg">
											Start a conversation to see the transcript here
										</p>
									</div>
								</div>
							) : (
								<div className="space-y-4">
									{transcript.map((msg, index) => (
										<div
											key={index}
											className={`flex ${
												msg.role === "user" ? "justify-end" : "justify-start"
											}`}
										>
											<div
												className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
													msg.role === "user"
														? "bg-purple-600 text-white"
														: "bg-gray-100 text-gray-900"
												}`}
											>
												<p className="text-sm">{msg.text}</p>
												<p
													className={`text-xs mt-1 ${
														msg.role === "user"
															? "text-purple-200"
															: "text-gray-500"
													}`}
												>
													{formatTime(msg.timestamp)}
												</p>
											</div>
										</div>
									))}
									<div ref={transcriptEndRef} />
								</div>
							)}
						</div>

						{/* Controls */}
						<div className="border-t border-gray-200 p-6">
							<div className="flex justify-center">
								{!isConnected ? (
									<button
										onClick={startCall}
										className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-full flex items-center space-x-3 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
									>
										<svg
											className="w-6 h-6"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
											/>
										</svg>
										<span>Start Conversation</span>
									</button>
								) : (
									<button
										onClick={endCall}
										className="bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-8 rounded-full flex items-center space-x-3 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
									>
										<svg
											className="w-6 h-6"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
											/>
										</svg>
										<span>End Conversation</span>
									</button>
								)}
							</div>
						</div>
					</div>

					{/* Instructions */}
					<div className="mt-8 bg-white rounded-xl shadow-lg p-6">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">
							How to use:
						</h3>
						<div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
							<div className="flex items-start space-x-3">
								<div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
									<span className="text-purple-600 font-bold text-xs">1</span>
								</div>
								<p>
									Click &ldquo;Start Conversation&rdquo; to begin your voice
									session
								</p>
							</div>
							<div className="flex items-start space-x-3">
								<div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
									<span className="text-purple-600 font-bold text-xs">2</span>
								</div>
								<p>Allow microphone access when prompted by your browser</p>
							</div>
							<div className="flex items-start space-x-3">
								<div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
									<span className="text-purple-600 font-bold text-xs">3</span>
								</div>
								<p>
									Start speaking naturally - the AI will respond in real-time
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
