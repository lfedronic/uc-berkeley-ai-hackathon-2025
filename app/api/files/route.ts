import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import path from "path";

export async function GET() {
	try {
		const contentDir = path.join(process.cwd(), "content");

		try {
			const items = await readdir(contentDir);
			const files = [];

			for (const item of items) {
				const itemPath = path.join(contentDir, item);
				const stats = await stat(itemPath);

				if (stats.isDirectory()) {
					// This is a folder for a processed file
					try {
						const folderContents = await readdir(itemPath);
						const folderStats = await stat(itemPath);

						files.push({
							name: item,
							type: "folder",
							size: 0, // We'll calculate this if needed
							created: folderStats.birthtime,
							modified: folderStats.mtime,
							contents: folderContents,
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
