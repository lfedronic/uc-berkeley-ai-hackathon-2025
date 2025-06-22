import fs from "fs/promises";
import path from "path";
import { EmbeddingService } from "../app/lib/embedding-service";
import "dotenv/config";

const SAMPLE_TEXTS = [
	{
		filename: "sample_1.txt",
		content: `
Machine Learning Fundamentals

Machine learning is a subset of artificial intelligence (AI) that focuses on the development of algorithms and statistical models that enable computer systems to improve their performance on a specific task through experience, without being explicitly programmed.

Key Concepts:

1. Supervised Learning: Uses labeled training data to learn a mapping function from input variables to output variables.
2. Unsupervised Learning: Finds hidden patterns in data without labeled examples.
3. Reinforcement Learning: Learns through interaction with an environment using reward signals.

Applications include image recognition, natural language processing, recommendation systems, and autonomous vehicles.
		`.trim(),
	},
	{
		filename: "sample_2.txt",
		content: `
Web Development Best Practices

Modern web development involves creating responsive, accessible, and performant web applications. Here are some key principles:

Frontend Development:
- Use semantic HTML for better accessibility
- Implement responsive design with CSS Grid and Flexbox
- Optimize images and use modern formats like WebP
- Minimize JavaScript bundle sizes

Backend Development:
- Follow RESTful API design principles
- Implement proper error handling and logging
- Use database indexing for query optimization
- Secure APIs with authentication and authorization

Testing is crucial - implement unit tests, integration tests, and end-to-end testing.
		`.trim(),
	},
	{
		filename: "sample_3.txt",
		content: `
Data Science Pipeline

A typical data science project follows these stages:

1. Problem Definition: Clearly define the business problem and success metrics.
2. Data Collection: Gather relevant data from various sources.
3. Data Cleaning: Handle missing values, outliers, and inconsistencies.
4. Exploratory Data Analysis: Understand data patterns and relationships.
5. Feature Engineering: Create meaningful features for modeling.
6. Model Building: Try different algorithms and hyperparameter tuning.
7. Model Evaluation: Use appropriate metrics to assess performance.
8. Deployment: Deploy the model to production environment.
9. Monitoring: Track model performance over time.

Tools commonly used include Python, R, SQL, Jupyter notebooks, and cloud platforms.
		`.trim(),
	},
];

async function createSampleData(): Promise<string> {
	console.log("Creating sample data folder...");

	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	const folderName = `${timestamp}_test_embeddings`;
	const contentDir = path.join(process.cwd(), "content");
	const folderPath = path.join(contentDir, folderName);

	// Create directories
	await fs.mkdir(contentDir, { recursive: true });
	await fs.mkdir(folderPath, { recursive: true });

	// Create sample text files
	for (const sample of SAMPLE_TEXTS) {
		const filePath = path.join(folderPath, sample.filename);
		await fs.writeFile(filePath, sample.content, "utf-8");
	}

	// Create files.json index
	const filesIndex = {
		textFiles: SAMPLE_TEXTS.map((s) => s.filename).sort(),
		imageFiles: [],
		totalFiles: SAMPLE_TEXTS.length,
		createdAt: new Date().toISOString(),
	};

	const indexPath = path.join(folderPath, "files.json");
	await fs.writeFile(indexPath, JSON.stringify(filesIndex, null, 2), "utf-8");

	console.log(`Created test folder: ${folderName}`);
	return folderPath;
}

async function testEmbeddingGeneration(folderPath: string): Promise<void> {
	console.log("\n=== Testing Embedding Generation ===");

	const embeddingService = new EmbeddingService();

	// Test folder indexing
	const embeddedChunks = await embeddingService.indexFolder(folderPath);
	console.log(`Generated ${embeddedChunks.length} embedded chunks`);

	if (embeddedChunks.length === 0) {
		throw new Error("No embedded chunks were generated");
	}

	// Test saving embeddings
	await embeddingService.saveEmbeddingIndex(folderPath, embeddedChunks);
	console.log("Embeddings saved successfully");

	// Test loading embeddings
	const loadedIndex = await embeddingService.loadEmbeddingIndex(folderPath);
	if (!loadedIndex) {
		throw new Error("Failed to load embedding index");
	}

	console.log(`Loaded index with ${loadedIndex.chunks.length} chunks`);
	console.log(`Embedding model: ${loadedIndex.metadata.embeddingModel}`);
	console.log(`Last updated: ${loadedIndex.metadata.lastUpdated}`);
}

async function testSemanticSearch(): Promise<void> {
	console.log("\n=== Testing Semantic Search ===");

	const embeddingService = new EmbeddingService();

	const testQueries = [
		"What is machine learning?",
		"How to optimize web performance?",
		"Data science process steps",
		"Frontend development techniques",
		"Python programming",
	];

	for (const query of testQueries) {
		console.log(`\nSearching for: "${query}"`);

		const results = await embeddingService.searchSimilar(
			query,
			undefined, // Search all folders
			3, // Top 3 results
			0.6 // Lower threshold for testing
		);

		console.log(`Found ${results.length} results:`);

		for (const result of results) {
			console.log(
				`  - ${result.metadata.fileName} (chunk ${result.metadata.chunkIndex})`
			);
			console.log(`    Similarity: ${result.similarity.toFixed(3)}`);
			console.log(`    Preview: ${result.content.substring(0, 100)}...`);
		}
	}
}

async function testGlobalStats(): Promise<void> {
	console.log("\n=== Testing Global Statistics ===");

	const embeddingService = new EmbeddingService();
	const stats = await embeddingService.getGlobalStats();

	console.log("Global Statistics:");
	console.log(`  Total Folders: ${stats.totalFolders}`);
	console.log(`  Total Files: ${stats.totalFiles}`);
	console.log(`  Total Chunks: ${stats.totalChunks}`);
	console.log(`  Last Updated: ${stats.lastUpdated}`);
}

async function testApiEndpoints(): Promise<void> {
	console.log("\n=== Testing API Endpoints ===");

	const baseUrl = "http://localhost:3000";

	try {
		// Test stats endpoint
		console.log("Testing /api/embeddings/stats...");
		const statsResponse = await fetch(`${baseUrl}/api/embeddings/stats`);
		if (statsResponse.ok) {
			const statsData = await statsResponse.json();
			console.log("Stats API response:", statsData);
		} else {
			console.log("Stats API not available (server not running)");
		}

		// Test search endpoint
		console.log("Testing /api/search...");
		const searchResponse = await fetch(
			`${baseUrl}/api/search?q=machine%20learning&topK=2`
		);
		if (searchResponse.ok) {
			const searchData = await searchResponse.json();
			console.log("Search API response:", searchData);
		} else {
			console.log("Search API not available (server not running)");
		}
	} catch {
		console.log("API endpoints not available (server not running)");
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function cleanupTestData(folderPath: string): Promise<void> {
	console.log("\n=== Cleaning Up Test Data ===");

	try {
		await fs.rm(folderPath, { recursive: true, force: true });
		console.log("Test folder cleaned up successfully");
	} catch (error) {
		console.error("Error cleaning up test folder:", error);
	}
}

async function runAllTests(): Promise<void> {
	console.log("🚀 Starting Embedding System Tests\n");

	// Check if OpenAI API key is available
	if (!process.env.OPENAI_API_KEY) {
		console.error("❌ OPENAI_API_KEY not found in environment variables");
		process.exit(1);
	}

	let folderPath: string;

	try {
		// Create sample data
		folderPath = await createSampleData();

		// Test embedding generation
		await testEmbeddingGeneration(folderPath);

		// Test semantic search
		await testSemanticSearch();

		// Test global statistics
		await testGlobalStats();

		// Test API endpoints
		await testApiEndpoints();

		console.log("\n✅ All tests completed successfully!");
	} catch (error) {
		console.error("\n❌ Test failed:", error);
		process.exit(1);
	} finally {
		// Cleanup
		// Uncomment the line below if you want to keep test data for inspection
		// await cleanupTestData(folderPath!);
		console.log("\n💡 Test data folder preserved for inspection");
	}
}

// Run tests if this script is executed directly
if (require.main === module) {
	runAllTests().catch(console.error);
}

export {
	runAllTests,
	createSampleData,
	testEmbeddingGeneration,
	testSemanticSearch,
};
