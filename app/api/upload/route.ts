import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import fs from "fs/promises";
import path from "path";
import { FileProcessor } from "../../lib/file-processor";

export async function POST(request: NextRequest) {
	try {
		const data = await request.formData();
		const file: File | null = data.get("file") as unknown as File;

		if (!file) {
			return NextResponse.json(
				{ success: false, error: "No file uploaded" },
				{ status: 400 }
			);
		}

		// Check file size (limit to 500MB)
		const maxSize = 500 * 1024 * 1024; // 500MB
		if (file.size > maxSize) {
			return NextResponse.json(
				{ success: false, error: "File too large. Maximum size is 500MB." },
				{ status: 400 }
			);
		}

		// Check file type
		const allowedTypes = [
			"text/plain",
			"text/markdown",
			"application/pdf",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			"application/msword",
			"video/mp4",
			"video/quicktime",
			"video/x-msvideo",
			"video/webm",
			"application/json",
			"text/csv",
		];

		if (!allowedTypes.includes(file.type)) {
			return NextResponse.json(
				{
					success: false,
					error:
						"File type not supported. Supported types: text, markdown, PDF, DOCX, DOC, videos (MP4, MOV, AVI, WebM), JSON, CSV",
				},
				{ status: 400 }
			);
		}

		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);

		// Create content directory if it doesn't exist
		const contentDir = path.join(process.cwd(), "content");
		try {
			await mkdir(contentDir, { recursive: true });
		} catch {
			// Directory might already exist, that's okay
		}

		// Create temporary file for processing
		const tempFilename = `temp_${Date.now()}_${file.name}`;
		const tempFilepath = path.join(contentDir, tempFilename);

		// Save temporary file
		await writeFile(tempFilepath, buffer);

		try {
			// Process the file
			const processedFile = await FileProcessor.processFile(
				tempFilepath,
				file.name,
				file.type
			);

			// Clean up temp file
			try {
				await fs.unlink(tempFilepath);
			} catch {
				// Ignore cleanup errors
			}

			return NextResponse.json({
				success: true,
				message: "File uploaded and processed successfully",
				folderName: path.basename(processedFile.folderPath),
				originalName: file.name,
				size: file.size,
				type: file.type,
				processedFiles: processedFile.processedFiles,
			});
		} catch (processingError) {
			console.error("Error processing file:", processingError);

			// Clean up temp file
			try {
				await fs.unlink(tempFilepath);
			} catch {
				// Ignore cleanup errors
			}

			return NextResponse.json(
				{
					success: false,
					error: "File upload succeeded but processing failed",
				},
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error("Error uploading file:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to upload file" },
			{ status: 500 }
		);
	}
}
