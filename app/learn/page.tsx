import React from "react";
import Link from "next/link";

export default function LearnPage() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8">
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
					<h1 className="text-4xl font-bold text-gray-900 mb-4">Learn</h1>
					<p className="text-lg text-gray-600">
						Start learning from your uploaded content
					</p>
				</div>

				{/* Coming Soon Card */}
				<div className="bg-white rounded-2xl shadow-xl p-12 text-center">
					<div className="mb-6">
						<svg
							className="w-20 h-20 mx-auto text-green-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
							/>
						</svg>
					</div>

					<h2 className="text-3xl font-bold text-gray-900 mb-4">
						Learning Features Coming Soon!
					</h2>
					<p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
						We&apos;re working hard to bring you an amazing learning experience.
						Soon you&apos;ll be able to:
					</p>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
						<div className="bg-green-50 p-6 rounded-xl">
							<div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
								<svg
									className="w-6 h-6 text-green-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
							<h3 className="font-semibold text-gray-900 mb-2">
								Interactive Q&A
							</h3>
							<p className="text-sm text-gray-600">
								Ask questions about your uploaded content and get AI-powered
								answers
							</p>
						</div>

						<div className="bg-green-50 p-6 rounded-xl">
							<div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
								<svg
									className="w-6 h-6 text-green-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
									/>
								</svg>
							</div>
							<h3 className="font-semibold text-gray-900 mb-2">
								Content Analysis
							</h3>
							<p className="text-sm text-gray-600">
								Get insights and summaries from your documents and videos
							</p>
						</div>

						<div className="bg-green-50 p-6 rounded-xl">
							<div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
								<svg
									className="w-6 h-6 text-green-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
									/>
								</svg>
							</div>
							<h3 className="font-semibold text-gray-900 mb-2">Study Plans</h3>
							<p className="text-sm text-gray-600">
								Generate personalized study plans based on your content
							</p>
						</div>

						<div className="bg-green-50 p-6 rounded-xl">
							<div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
								<svg
									className="w-6 h-6 text-green-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M13 10V3L4 14h7v7l9-11h-7z"
									/>
								</svg>
							</div>
							<h3 className="font-semibold text-gray-900 mb-2">
								Smart Quizzes
							</h3>
							<p className="text-sm text-gray-600">
								Test your knowledge with automatically generated quizzes
							</p>
						</div>
					</div>

					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Link
							href="/upload"
							className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
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
									d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
								/>
							</svg>
							Upload Content First
						</Link>

						<button
							disabled
							className="bg-gray-300 text-gray-500 font-semibold py-3 px-6 rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
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
									d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
								/>
							</svg>
							Coming Soon...
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
