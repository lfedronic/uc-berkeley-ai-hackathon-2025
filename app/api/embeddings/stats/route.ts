import { NextResponse } from "next/server";
import { EmbeddingService } from "../../../lib/embedding-service";

export async function GET() {
	try {
		const embeddingService = new EmbeddingService();
		const stats = await embeddingService.getGlobalStats();

		return NextResponse.json({
			success: true,
			stats,
		});
	} catch (error) {
		console.error("Error getting embedding stats:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to get embedding statistics" },
			{ status: 500 }
		);
	}
}
