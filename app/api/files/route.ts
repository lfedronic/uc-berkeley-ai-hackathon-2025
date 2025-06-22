import { NextResponse } from "next/server";
import { readdir, stat, readFile } from "fs/promises";
import * as path from "path";

// Files and directories to ignore
const IGNORED_FILES = [
	".DS_Store",
	"Thumbs.db",
	".gitignore",
	".gitkeep",
	"desktop.ini",
	"$RECYCLE.BIN",
	".Spotlight-V100",
	".Trashes",
	"ehthumbs.db",
	"Icon\r",
];

const IGNORED_EXTENSIONS = [".tmp", ".temp", ".cache", ".log"];

function shouldIgnoreFile(filename: string): boolean {
	// Check if file is in ignored list
	if (IGNORED_FILES.includes(filename)) {
		return true;
	}

	// Check if file has ignored extension
	const ext = path.extname(filename).toLowerCase();
	if (IGNORED_EXTENSIONS.includes(ext)) {
		return true;
	}

	// Ignore hidden files (starting with .)
	if (filename.startsWith(".")) {
		return true;
	}

	return false;
}

export async function GET() {
	try {
		const contentDir = path.join(process.cwd(), "content");

		try {
			const items = await readdir(contentDir);
			const files = [];

			for (const item of items) {
				// Skip ignored files and directories
				if (shouldIgnoreFile(item)) {
					continue;
				}

				const itemPath = path.join(contentDir, item);
				const stats = await stat(itemPath);

				if (stats.isDirectory()) {
					// This is a folder for a processed file
					try {
						const folderContents = await readdir(itemPath);
						const folderStats = await stat(itemPath);

						// Filter out ignored files from folder contents
						const filteredContents = folderContents.filter(
							(file) => !shouldIgnoreFile(file)
						);

						// Try to read files.json for additional metadata
						let description = "Processed folder";
						let originalFileName = item;
						let mimeType = "";

						try {
							const filesJsonPath = path.join(itemPath, "files.json");
							const filesJsonContent = await readFile(filesJsonPath, "utf-8");
							const filesJson = JSON.parse(filesJsonContent);

							if (filesJson.description) {
								description = filesJson.description;
							}
							if (filesJson.originalFileName) {
								originalFileName = filesJson.originalFileName;
							}
							if (filesJson.mimeType) {
								mimeType = filesJson.mimeType;
							}
						} catch {
							// files.json doesn't exist or is invalid, use defaults
						}

						files.push({
							name: item,
							type: "folder",
							size: 0, // We'll calculate this if needed
							created: folderStats.birthtime,
							modified: folderStats.mtime,
							contents: filteredContents,
							description,
							originalFileName,
							mimeType,
						});
					} catch (error) {
						console.error(`Error reading folder ${item}:`, error);
					}
				} else {
					// This is a direct file (legacy uploads)
					files.push({
						name: item,
						type: "file",
						size: stats.size,
						created: stats.birthtime,
						modified: stats.mtime,
						contents: null,
					});
				}
			}

			return NextResponse.json({
				success: true,
				files: files.sort(
					(a, b) => b.modified.getTime() - a.modified.getTime()
				),
			});
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") {
				// Content directory doesn't exist yet
				return NextResponse.json({
					success: true,
					files: [],
				});
			}
			throw error;
		}
	} catch (error) {
		console.error("Error listing files:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to list files" },
			{ status: 500 }
		);
	}
}
