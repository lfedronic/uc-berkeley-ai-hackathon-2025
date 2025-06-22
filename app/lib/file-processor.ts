import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
// import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { AssemblyAI } from "assemblyai";
import { EmbeddingService } from "./embedding-service";

const execAsync = promisify(exec);

export interface ProcessedFile {
	originalPath: string;
	folderPath: string;
	processedFiles: {
		type: string;
		path: string;
		description: string;
	}[];
}

export class FileProcessor {
	private static async createFolder(folderPath: string): Promise<void> {
		try {
			await fs.mkdir(folderPath, { recursive: true });
		} catch (error) {
			console.error("Error creating folder:", error);
			throw error;
		}
	}

	private static async saveTextFile(
		content: string,
		filePath: string
	): Promise<void> {
		await fs.writeFile(filePath, content, "utf8");
	}

	private static async createFilesIndex(folderPath: string): Promise<void> {
		try {
			const files = await fs.readdir(folderPath);
			const textFiles: string[] = [];
			const imageFiles: string[] = [];

			for (const file of files) {
				const filePath = path.join(folderPath, file);
				const stat = await fs.stat(filePath);

				// Skip directories and the files.json itself
				if (stat.isDirectory() || file === "files.json") {
					continue;
				}

				const ext = path.extname(file).toLowerCase();

				// Check for text files
				if (ext === ".txt" || ext === ".md") {
					textFiles.push(file);
				}

				// Check for image files
				if ([".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"].includes(ext)) {
					imageFiles.push(file);
				}
			}

			const filesIndex = {
				textFiles: textFiles.sort(),
				imageFiles: imageFiles.sort(),
				totalFiles: textFiles.length + imageFiles.length,
				createdAt: new Date().toISOString(),
			};

			const indexPath = path.join(folderPath, "files.json");
			await fs.writeFile(
				indexPath,
				JSON.stringify(filesIndex, null, 2),
				"utf8"
			);

			console.log(
				`Created files.json with ${filesIndex.totalFiles} indexed files`
			);
		} catch (error) {
			console.error("Error creating files index:", error);
			// Don't throw - this is not critical for the main functionality
		}
	}

	private static async generateEmbeddings(folderPath: string): Promise<void> {
		try {
			const embeddingService = new EmbeddingService();
			console.log(
				`Generating embeddings for folder: ${path.basename(folderPath)}`
			);

			const embeddedChunks = await embeddingService.indexFolder(folderPath);

			if (embeddedChunks.length > 0) {
				await embeddingService.saveEmbeddingIndex(folderPath, embeddedChunks);
				console.log(
					`Generated ${embeddedChunks.length} embeddings for ${path.basename(
						folderPath
					)}`
				);
			} else {
				console.log(
					`No text files found to embed in ${path.basename(folderPath)}`
				);
			}
		} catch (error) {
			console.error("Error generating embeddings:", error);
			// Don't throw - embeddings are optional, file processing should continue
		}
	}

	private static async processPDF(
		filePath: string,
		outputFolder: string
	): Promise<string[]> {
		try {
			// Use pdftotext command line tool for PDF text extraction
			const textPath = path.join(outputFolder, "extracted_text.txt");
			await execAsync(`pdftotext "${filePath}" "${textPath}"`);
			return ["extracted_text.txt"];
		} catch (error) {
			console.error("Error processing PDF:", error);
			// If pdftotext fails, create a placeholder
			const textPath = path.join(outputFolder, "extracted_text.txt");
			await this.saveTextFile(
				"PDF text extraction failed. Please install poppler-utils for PDF processing.\nTo install: brew install poppler",
				textPath
			);
			return ["extracted_text.txt"];
		}
	}

	private static async processDOCX(
		filePath: string,
		outputFolder: string
	): Promise<string[]> {
		try {
			const docxBuffer = await fs.readFile(filePath);
			const result = await mammoth.extractRawText({ buffer: docxBuffer });

			const textPath = path.join(outputFolder, "extracted_text.txt");
			await this.saveTextFile(result.value, textPath);

			return ["extracted_text.txt"];
		} catch (error) {
			console.error("Error processing DOCX:", error);
			throw error;
		}
	}

	private static async processVideo(
		filePath: string,
		outputFolder: string
	): Promise<string[]> {
		const processedFiles: string[] = [];

		try {
			// Extract audio for transcription
			const audioPath = path.join(outputFolder, "extracted_audio.wav");
			await execAsync(
				`ffmpeg -i "${filePath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${audioPath}"`
			);
			processedFiles.push("extracted_audio.wav");

			// Get video duration
			const durationCmd = `ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
			const { stdout: durationStr } = await execAsync(durationCmd);
			const duration = parseFloat(durationStr.trim());

			// Take screenshots every 5 minutes (300 seconds)
			const screenshotInterval = 300; // 5 minutes in seconds
			const screenshotCount = Math.floor(duration / screenshotInterval);

			for (let i = 0; i <= screenshotCount; i++) {
				const timestamp = i * screenshotInterval;
				const screenshotPath = path.join(
					outputFolder,
					`screenshot_${i.toString().padStart(3, "0")}.jpg`
				);

				try {
					await execAsync(
						`ffmpeg -ss ${timestamp} -i "${filePath}" -frames:v 1 -q:v 2 "${screenshotPath}"`
					);
					processedFiles.push(
						`screenshot_${i.toString().padStart(3, "0")}.jpg`
					);
				} catch (error) {
					console.error(`Error creating screenshot at ${timestamp}s:`, error);
				}
			}

			// Generate transcript using AssemblyAI
			try {
				const client = new AssemblyAI({
					apiKey: "d56a927279e9451dbe9107dd4df9e259",
				});

				const params = {
					audio: audioPath,
					speech_model: "universal" as const,
				};

				console.log("Starting transcription with AssemblyAI...");
				const transcript = await client.transcripts.transcribe(params);

				if (transcript.status === "completed" && transcript.text) {
					const transcriptPath = path.join(outputFolder, "transcript.txt");
					await this.saveTextFile(transcript.text, transcriptPath);
					processedFiles.push("transcript.txt");
					console.log("Transcription completed successfully");
				} else {
					console.log("Transcription failed or returned no text");
				}
			} catch (transcriptError) {
				console.error("Error generating transcript:", transcriptError);
				// Don't throw - we still want to keep the audio file even if transcription fails
			}

			return processedFiles;
		} catch (error) {
			console.error("Error processing video:", error);
			throw error;
		}
	}

	private static async processTextFile(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		filePath: string,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		outputFolder: string
	): Promise<string[]> {
		// For text files, we just copy them as-is since they're already in the right format
		return [];
	}

	private static async processImageFile(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		filePath: string,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		outputFolder: string
	): Promise<string[]> {
		// For images, we keep them as-is
		// In the future, we could add OCR or image description here
		return [];
	}

	public static async processFile(
		originalFilePath: string,
		filename: string,
		mimeType: string
	): Promise<ProcessedFile> {
		// Create a sanitized folder name
		const sanitizedName = filename
			.replace(/[^a-zA-Z0-9.-]/g, "_")
			.replace(/\.[^/.]+$/, "");
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const folderName = `${timestamp}_${sanitizedName}`;

		const contentDir = path.join(process.cwd(), "content");
		const folderPath = path.join(contentDir, folderName);

		// Create the folder
		await this.createFolder(folderPath);

		// Copy the original file to the folder
		const originalFileName = filename;
		const originalDestPath = path.join(folderPath, originalFileName);
		await fs.copyFile(originalFilePath, originalDestPath);

		// Process based on file type
		let processedFiles: string[] = [];

		try {
			if (mimeType === "application/pdf") {
				processedFiles = await this.processPDF(originalDestPath, folderPath);
			} else if (
				mimeType ===
					"application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
				mimeType === "application/msword"
			) {
				processedFiles = await this.processDOCX(originalDestPath, folderPath);
			} else if (mimeType.startsWith("video/")) {
				processedFiles = await this.processVideo(originalDestPath, folderPath);
			} else if (mimeType.startsWith("text/")) {
				processedFiles = await this.processTextFile(
					originalDestPath,
					folderPath
				);
			} else if (mimeType.startsWith("image/")) {
				processedFiles = await this.processImageFile(
					originalDestPath,
					folderPath
				);
			}
		} catch (error) {
			console.error("Error processing file:", error);
			// Don't throw here - we still want to keep the original file even if processing fails
		}

		// Create files.json index for easy access to text and image files
		await this.createFilesIndex(folderPath);

		// Generate embeddings for text files
		await this.generateEmbeddings(folderPath);

		// Processing summary removed per user request

		return {
			originalPath: originalDestPath,
			folderPath,
			processedFiles: [
				{
					type: "original",
					path: originalFileName,
					description: "Original uploaded file",
				},
				...processedFiles.map((file) => ({
					type: this.getProcessedFileType(file),
					path: file,
					description: this.getProcessedFileDescription(file),
				})),
			],
		};
	}

	private static getProcessedFileType(filename: string): string {
		if (filename.endsWith(".txt")) return "text";
		if (filename.endsWith(".wav")) return "audio";
		if (filename.endsWith(".jpg") || filename.endsWith(".png")) return "image";
		return "processed";
	}

	private static getProcessedFileDescription(filename: string): string {
		if (filename === "extracted_text.txt") return "Extracted text content";
		if (filename === "extracted_audio.wav") return "Extracted audio track";
		if (filename === "transcript.txt") return "Audio transcript (AssemblyAI)";
		if (filename.startsWith("screenshot_")) return "Video screenshot";
		return "Processed file";
	}
}
