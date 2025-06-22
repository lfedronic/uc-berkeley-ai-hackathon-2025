import { NextRequest, NextResponse } from "next/server";
import { EmbeddingService } from "../../lib/embedding-service";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const query = searchParams.get("q");
		const folder = searchParams.get("folder");
		const topK = parseInt(searchParams.get("topK") || "5");
		const threshold = parseFloat(searchParams.get("threshold") || "0.7");

		if (!query) {
			return NextResponse.json(
				{ success: false, error: "Query parameter 'q' is required" },
				{ status: 400 }
			);
		}

		const embeddingService = new EmbeddingService();
		const results = await embeddingService.searchSimilar(
			query,
			folder || undefined,
			topK,
			threshold
		);

		return NextResponse.json({
			success: true,
			results,
			query,
			totalResults: results.length,
		});
	} catch (error) {
		console.error("Error searching embeddings:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to search embeddings" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const { query, folder, topK = 5, threshold = 0.7 } = await request.json();

		if (!query) {
			return NextResponse.json(
				{ success: false, error: "Query is required" },
				{ status: 400 }
			);
		}

		const embeddingService = new EmbeddingService();
		const results = await embeddingService.searchSimilar(
			query,
			folder,
			topK,
			threshold
		);

		return NextResponse.json({
			success: true,
			results,
			query,
			totalResults: results.length,
		});
	} catch (error) {
		console.error("Error searching embeddings:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to search embeddings" },
			{ status: 500 }
		);
	}
}
