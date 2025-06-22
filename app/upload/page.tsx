"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface UploadedFile {
	filename: string;
	originalName: string;
	size: number;
	type: string;
}

interface ExistingFile {
	name: string;
	type: "folder" | "file";
	size: number;
	created: string;
	modified: string;
	contents: string[] | null;
	description?: string;
	originalFileName?: string;
	mimeType?: string;
}

export default function UploadPage() {
	const [isDragOver, setIsDragOver] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
	const [existingFiles, setExistingFiles] = useState<ExistingFile[]>([]);
	const [isLoadingFiles, setIsLoadingFiles] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Load existing files
	useEffect(() => {
		loadExistingFiles();
	}, []);

	const loadExistingFiles = async () => {
		try {
			setIsLoadingFiles(true);
			const response = await fetch("/api/files");
			const result = await response.json();

			if (result.success) {
				setExistingFiles(result.files);
			}
		} catch (error) {
			console.error("Failed to load existing files:", error);
		} finally {
			setIsLoadingFiles(false);
		}
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(false);

		const files = Array.from(e.dataTransfer.files);
		handleFiles(files);
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const files = Array.from(e.target.files);
			handleFiles(files);
		}
	};

	const handleFiles = async (files: File[]) => {
		setError(null);
		setIsUploading(true);

		for (const file of files) {
			try {
				const formData = new FormData();
				formData.append("file", file);

				const response = await fetch("/api/upload", {
					method: "POST",
					body: formData,
				});

				const result = await response.json();

				if (result.success) {
					setUploadedFiles((prev) => [
						...prev,
						{
							filename: result.folderName || result.filename || "Unknown",
							originalName: result.originalName,
							size: result.size,
							type: result.type,
						},
					]);
					// Refresh the existing files list
					loadExistingFiles();
				} else {
					setError(result.error || "Upload failed");
				}
			} catch (err) {
				setError("Network error during upload");
				console.error("Upload error:", err);
			}
		}

		setIsUploading(false);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const supportedFormats = [
		"Text files (.txt, .md)",
		"Documents (.pdf, .docx, .doc)",
		"Videos (.mp4, .mov, .avi, .webm)",
		"Data files (.json, .csv)",
	];

	return (
		<div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-8">
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
					<h1 className="text-4xl font-bold text-gray-900 mb-4">
						Upload Content
					</h1>
					<p className="text-lg text-gray-600">
						Upload your files to get started with learning
					</p>
				</div>

				{/* Upload Area */}
				<div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
					<div
						className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors duration-200 ${
							isDragOver
								? "border-blue-500 bg-blue-50"
								: "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
						}`}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
					>
						<div className="mb-6">
							<svg
								className="w-16 h-16 mx-auto text-gray-400"
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
						</div>

						<h3 className="text-xl font-semibold text-gray-900 mb-2">
							Drag and drop your files here
						</h3>
						<p className="text-gray-600 mb-6">
							or click to browse your computer
						</p>

						<input
							ref={fileInputRef}
							type="file"
							multiple
							onChange={handleFileSelect}
							className="hidden"
							accept=".txt,.md,.pdf,.docx,.doc,.mp4,.mov,.avi,.webm,.json,.csv"
						/>

						<button
							onClick={() => fileInputRef.current?.click()}
							disabled={isUploading}
							className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
						>
							{isUploading ? "Uploading..." : "Choose Files"}
						</button>

						<div className="mt-6 text-sm text-gray-500">
							<p className="font-medium mb-2">Supported formats:</p>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
								{supportedFormats.map((format, index) => (
									<p key={index}>• {format}</p>
								))}
							</div>
							<p className="mt-2">Maximum file size: 500MB per file</p>
						</div>
					</div>

					{/* Error Display */}
					{error && (
						<div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
							<div className="flex items-center gap-2">
								<svg
									className="w-5 h-5 text-red-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<p className="text-red-700 font-medium">Error: {error}</p>
							</div>
						</div>
					)}

					{/* Upload Progress */}
					{isUploading && (
						<div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
							<div className="flex items-center gap-2">
								<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
								<p className="text-blue-700 font-medium">
									Uploading and processing files... AI is generating
									descriptions.
								</p>
							</div>
						</div>
					)}
				</div>

				{/* Existing Files List */}
				<div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
					<h2 className="text-2xl font-bold text-gray-900 mb-6">
						Your Files ({existingFiles.length})
					</h2>

					{isLoadingFiles ? (
						<div className="flex items-center justify-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
							<span className="ml-3 text-gray-600">Loading files...</span>
						</div>
					) : existingFiles.length === 0 ? (
						<div className="text-center py-12">
							<div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-4">
								<svg
									className="w-10 h-10 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
									/>
								</svg>
							</div>
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								No files uploaded yet
							</h3>
							<p className="text-gray-500">
								Upload your first file to get started with learning
							</p>
						</div>
					) : (
						<div className="space-y-4">
							{existingFiles.map((file, index) => (
								<div
									key={index}
									className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
								>
									<div className="flex items-start gap-4">
										<div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
											{file.type === "folder" ? (
												<svg
													className="w-6 h-6 text-blue-600"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z"
													/>
												</svg>
											) : (
												<svg
													className="w-6 h-6 text-blue-600"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
													/>
												</svg>
											)}
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<h3 className="font-semibold text-gray-900 truncate">
														{file.originalFileName || file.name}
													</h3>
													<div className="flex items-center gap-2 mt-1">
														<span className="text-sm text-gray-500">
															{new Date(file.modified).toLocaleDateString()}
														</span>
														{file.mimeType && (
															<>
																<span className="text-gray-300">•</span>
																<span className="text-xs text-gray-400 uppercase">
																	{file.mimeType.split("/")[1] || file.mimeType}
																</span>
															</>
														)}
													</div>

													{file.description && (
														<p className="text-sm text-gray-600 mt-2 leading-relaxed">
															{file.description}
														</p>
													)}

													{file.contents && file.contents.length > 0 && (
														<div className="mt-3">
															<p className="text-xs text-gray-500 mb-1">
																Processed files ({file.contents.length}):
															</p>
															<div className="flex flex-wrap gap-1">
																{file.contents.slice(0, 3).map((item, idx) => (
																	<span
																		key={idx}
																		className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
																	>
																		{item}
																	</span>
																))}
																{file.contents.length > 3 && (
																	<span className="text-xs text-gray-400">
																		+{file.contents.length - 3} more
																	</span>
																)}
															</div>
														</div>
													)}
												</div>
												<div className="ml-4 text-right">
													<div className="text-xs text-gray-400">
														{file.type === "folder"
															? "Folder"
															: formatFileSize(file.size)}
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Uploaded Files List */}
				{uploadedFiles.length > 0 && (
					<div className="bg-white rounded-2xl shadow-xl p-8">
						<h2 className="text-2xl font-bold text-gray-900 mb-6">
							Uploaded Files ({uploadedFiles.length})
						</h2>
						<div className="space-y-4">
							{uploadedFiles.map((file, index) => (
								<div
									key={index}
									className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
								>
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
											<svg
												className="w-5 h-5 text-green-600"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
										</div>
										<div>
											<p className="font-medium text-gray-900">
												{file.originalName}
											</p>
											<p className="text-sm text-gray-500">
												{formatFileSize(file.size)} •{" "}
												{file.type.split("/")[1].toUpperCase()}
											</p>
										</div>
									</div>
									<div className="text-sm text-green-600 font-medium">
										Uploaded
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
