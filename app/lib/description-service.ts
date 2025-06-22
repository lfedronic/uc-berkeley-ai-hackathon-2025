import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import * as fs from "fs/promises";
import * as path from "path";

export class DescriptionService {
	private static readonly MAX_CONTENT_LENGTH = 4000; // Keep content under token limits

	/**
	 * Generate a description for a file based on its content and metadata
	 */
	public static async generateFileDescription(
		filePath: string,
		originalFileName: string,
		mimeType: string
	): Promise<string> {
		try {
			// Get basic file info
			const fileExtension = path.extname(originalFileName).toLowerCase();
			const fileSize = (await fs.stat(filePath)).size;

			// Try to extract some content for analysis
			let content = "";
			let contentType = "file";

			if (
				mimeType.startsWith("text/") ||
				fileExtension === ".txt" ||
				fileExtension === ".md"
			) {
				try {
					content = await fs.readFile(filePath, "utf-8");
					content = content.slice(0, this.MAX_CONTENT_LENGTH);
					contentType = "text";
				} catch {
					// Ignore read errors
				}
			}

			// Check if there's extracted text or transcript in the same folder
			const folderPath = path.dirname(filePath);
			const extractedTextPath = path.join(folderPath, "extracted_text.txt");
			const transcriptPath = path.join(folderPath, "transcript.txt");

			if (!content) {
				try {
					if (
						await fs
							.access(extractedTextPath)
							.then(() => true)
							.catch(() => false)
					) {
						content = await fs.readFile(extractedTextPath, "utf-8");
						content = content.slice(0, this.MAX_CONTENT_LENGTH);
						contentType = "extracted_text";
					} else if (
						await fs
							.access(transcriptPath)
							.then(() => true)
							.catch(() => false)
					) {
						content = await fs.readFile(transcriptPath, "utf-8");
						content = content.slice(0, this.MAX_CONTENT_LENGTH);
						contentType = "transcript";
					}
				} catch {
					// Ignore read errors
				}
			}

			// Generate description using GPT-4o
			const prompt = this.buildPrompt(
				originalFileName,
				mimeType,
				fileSize,
				content,
				contentType
			);

			const { text } = await generateText({
				model: openai("gpt-4o-mini"), // Using mini for cost efficiency
				prompt,
				maxTokens: 100, // Keep descriptions concise
				temperature: 0.7,
			});

			return text.trim();
		} catch (error) {
			console.error("Error generating description:", error);
			// Fallback to basic description
			return this.getFallbackDescription(originalFileName, mimeType);
		}
	}

	private static buildPrompt(
		fileName: string,
		mimeType: string,
		fileSize: number,
		content: string,
		contentType: string
	): string {
		const fileSizeFormatted = this.formatFileSize(fileSize);

		let prompt = `Generate a concise, helpful description (1-2 sentences, max 100 words) for this uploaded file:

File: ${fileName}
Type: ${mimeType}
Size: ${fileSizeFormatted}`;

		if (content) {
			prompt += `\n\nContent preview (${contentType}):\n${content}`;
		}

		prompt += `\n\nFocus on what the file contains and what it might be useful for. Be specific and informative.`;

		return prompt;
	}

	private static getFallbackDescription(
		fileName: string,
		mimeType: string
	): string {
		const ext = path.extname(fileName).toLowerCase();

		if (mimeType.startsWith("text/") || ext === ".txt" || ext === ".md") {
			return "Text document containing written content";
		} else if (mimeType === "application/pdf") {
			return "PDF document with text and potentially images";
		} else if (mimeType.includes("word") || ext === ".docx" || ext === ".doc") {
			return "Word document with formatted text content";
		} else if (mimeType.startsWith("video/")) {
			return "Video file with visual and audio content";
		} else if (mimeType.startsWith("audio/")) {
			return "Audio file with spoken or musical content";
		} else if (mimeType.startsWith("image/")) {
			return "Image file with visual content";
		} else if (mimeType === "application/json" || ext === ".json") {
			return "JSON data file with structured information";
		} else if (mimeType === "text/csv" || ext === ".csv") {
			return "CSV data file with tabular information";
		} else {
			return "Uploaded file ready for processing";
		}
	}

	private static formatFileSize(bytes: number): string {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	}
}
