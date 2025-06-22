import fs from "fs/promises";
import path from "path";
import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";

export interface TextChunk {
	id: string;
	content: string;
	metadata: {
		filePath: string;
		fileName: string;
		folderName: string;
		chunkIndex: number;
		timestamp: string;
	};
}

export interface EmbeddedChunk extends TextChunk {
	embedding: number[];
}

export interface EmbeddingIndex {
	chunks: EmbeddedChunk[];
	metadata: {
		totalChunks: number;
		lastUpdated: string;
		embeddingModel: string;
	};
}

export class EmbeddingService {
	private openai: ReturnType<typeof createOpenAI>;
	private readonly chunkSize = 1000;
	private readonly chunkOverlap = 200;
	private readonly embeddingModel = "text-embedding-3-small";

	constructor() {
		this.openai = createOpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});
	}

	/**
	 * Split text into chunks with overlap
	 */
	private splitText(text: string): string[] {
		const chunks: string[] = [];
		let start = 0;

		while (start < text.length) {
			const end = Math.min(start + this.chunkSize, text.length);
			chunks.push(text.slice(start, end));

			if (end === text.length) break;
			start += this.chunkSize - this.chunkOverlap;
		}

		return chunks;
	}

	/**
	 * Generate embedding for a text chunk
	 */
	private async generateEmbedding(text: string): Promise<number[]> {
		const { embedding } = await embed({
			model: this.openai.embedding(this.embeddingModel),
			value: text,
		});
		return embedding;
	}

	/**
	 * Calculate cosine similarity between two vectors
	 */
	private cosineSimilarity(a: number[], b: number[]): number {
		const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
		const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
		const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
		return dotProduct / (magnitudeA * magnitudeB);
	}

	/**
	 * Index a single text file
	 */
	async indexTextFile(
		filePath: string,
		folderName: string,
		fileName: string
	): Promise<EmbeddedChunk[]> {
		try {
			console.log(`Indexing text file: ${fileName}`);

			const content = await fs.readFile(filePath, "utf-8");
			const chunks = this.splitText(content);
			const embeddedChunks: EmbeddedChunk[] = [];

			for (let i = 0; i < chunks.length; i++) {
				const chunkContent = chunks[i].trim();
				if (chunkContent.length === 0) continue;

				const embedding = await this.generateEmbedding(chunkContent);

				const embeddedChunk: EmbeddedChunk = {
					id: `${folderName}_${fileName}_${i}`,
					content: chunkContent,
					embedding,
					metadata: {
						filePath,
						fileName,
						folderName,
						chunkIndex: i,
						timestamp: new Date().toISOString(),
					},
				};

				embeddedChunks.push(embeddedChunk);
			}

			console.log(`Indexed ${embeddedChunks.length} chunks from ${fileName}`);
			return embeddedChunks;
		} catch (error) {
			console.error(`Error indexing file ${fileName}:`, error);
			return [];
		}
	}

	/**
	 * Index all text files in a folder based on files.json
	 */
	async indexFolder(folderPath: string): Promise<EmbeddedChunk[]> {
		try {
			const filesJsonPath = path.join(folderPath, "files.json");
			const filesJsonContent = await fs.readFile(filesJsonPath, "utf-8");
			const filesIndex = JSON.parse(filesJsonContent);

			const allEmbeddedChunks: EmbeddedChunk[] = [];
			const folderName = path.basename(folderPath);

			for (const textFile of filesIndex.textFiles || []) {
				const textFilePath = path.join(folderPath, textFile);
				const embeddedChunks = await this.indexTextFile(
					textFilePath,
					folderName,
					textFile
				);
				allEmbeddedChunks.push(...embeddedChunks);
			}

			return allEmbeddedChunks;
		} catch (error) {
			console.error(`Error indexing folder ${folderPath}:`, error);
			return [];
		}
	}

	/**
	 * Save embedding index to file system (each embedding as separate file)
	 */
	async saveEmbeddingIndex(
		folderPath: string,
		chunks: EmbeddedChunk[]
	): Promise<void> {
		// Save each embedding as a separate file
		for (let i = 0; i < chunks.length; i++) {
			const chunk = chunks[i];
			const chunkPath = path.join(folderPath, `embedding_chunk_${i}.json`);
			await fs.writeFile(chunkPath, JSON.stringify(chunk, null, 2));
		}

		// Save index metadata
		const embeddingIndex = {
			metadata: {
				totalChunks: chunks.length,
				lastUpdated: new Date().toISOString(),
				embeddingModel: this.embeddingModel,
			},
			chunkFiles: chunks.map((_, i) => `embedding_chunk_${i}.json`),
		};

		const indexPath = path.join(folderPath, "embeddings_index.json");
		await fs.writeFile(indexPath, JSON.stringify(embeddingIndex, null, 2));
		console.log(
			`Saved ${chunks.length} embeddings as individual files in ${folderPath}`
		);
	}

	/**
	 * Load embedding index from file system (from individual files)
	 */
	async loadEmbeddingIndex(folderPath: string): Promise<EmbeddingIndex | null> {
		try {
			// Try new format first (individual files)
			const indexPath = path.join(folderPath, "embeddings_index.json");
			const indexContent = await fs.readFile(indexPath, "utf-8");
			const index = JSON.parse(indexContent);

			// Load individual chunk files
			const chunks: EmbeddedChunk[] = [];
			for (const chunkFile of index.chunkFiles) {
				const chunkPath = path.join(folderPath, chunkFile);
				const chunkContent = await fs.readFile(chunkPath, "utf-8");
				chunks.push(JSON.parse(chunkContent));
			}

			return {
				chunks,
				metadata: index.metadata,
			};
		} catch {
			// Fall back to old format for backward compatibility
			try {
				const oldIndexPath = path.join(folderPath, "embeddings.json");
				const content = await fs.readFile(oldIndexPath, "utf-8");
				return JSON.parse(content);
			} catch {
				console.log(`No embedding index found at ${folderPath}`);
				return null;
			}
		}
	}

	/**
	 * Search for similar chunks using semantic similarity (optimized for individual files)
	 */
	async searchSimilar(
		query: string,
		folderPath?: string,
		topK: number = 5,
		similarityThreshold: number = 0.7
	): Promise<Array<EmbeddedChunk & { similarity: number }>> {
		try {
			const queryEmbedding = await this.generateEmbedding(query);
			const results: Array<EmbeddedChunk & { similarity: number }> = [];

			// If folderPath is specified, search only in that folder
			if (folderPath) {
				await this.searchInFolder(
					folderPath,
					queryEmbedding,
					similarityThreshold,
					results
				);
			} else {
				// Search across all folders
				const contentDir = path.join(process.cwd(), "content");
				const folders = await fs.readdir(contentDir);

				for (const folder of folders) {
					const folderFullPath = path.join(contentDir, folder);
					const stat = await fs.stat(folderFullPath);

					if (stat.isDirectory()) {
						await this.searchInFolder(
							folderFullPath,
							queryEmbedding,
							similarityThreshold,
							results
						);
					}
				}
			}

			// Sort by similarity and return top K
			return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
		} catch (error) {
			console.error("Error searching similar chunks:", error);
			return [];
		}
	}

	/**
	 * Search in a specific folder (optimized to load embeddings individually)
	 */
	private async searchInFolder(
		folderPath: string,
		queryEmbedding: number[],
		similarityThreshold: number,
		results: Array<EmbeddedChunk & { similarity: number }>
	): Promise<void> {
		try {
			// Try new format first (individual files)
			const indexPath = path.join(folderPath, "embeddings_index.json");
			const indexContent = await fs.readFile(indexPath, "utf-8");
			const index = JSON.parse(indexContent);

			// Load and check each chunk file individually for better performance
			for (const chunkFile of index.chunkFiles) {
				const chunkPath = path.join(folderPath, chunkFile);
				const chunkContent = await fs.readFile(chunkPath, "utf-8");
				const chunk: EmbeddedChunk = JSON.parse(chunkContent);

				const similarity = this.cosineSimilarity(
					queryEmbedding,
					chunk.embedding
				);
				if (similarity >= similarityThreshold) {
					results.push({ ...chunk, similarity });
				}
			}
		} catch {
			// Fall back to old format
			const index = await this.loadEmbeddingIndex(folderPath);
			if (index) {
				for (const chunk of index.chunks) {
					const similarity = this.cosineSimilarity(
						queryEmbedding,
						chunk.embedding
					);
					if (similarity >= similarityThreshold) {
						results.push({ ...chunk, similarity });
					}
				}
			}
		}
	}

	/**
	 * Get global embedding statistics (optimized for individual files)
	 */
	async getGlobalStats(): Promise<{
		totalFolders: number;
		totalChunks: number;
		totalFiles: number;
		lastUpdated: string | null;
	}> {
		try {
			const contentDir = path.join(process.cwd(), "content");
			const folders = await fs.readdir(contentDir);

			let totalFolders = 0;
			let totalChunks = 0;
			let totalFiles = 0;
			let lastUpdated: string | null = null;

			for (const folder of folders) {
				const folderFullPath = path.join(contentDir, folder);
				const stat = await fs.stat(folderFullPath);

				if (stat.isDirectory()) {
					// Try new format first
					try {
						const indexPath = path.join(
							folderFullPath,
							"embeddings_index.json"
						);
						const indexContent = await fs.readFile(indexPath, "utf-8");
						const index = JSON.parse(indexContent);

						totalFolders++;
						totalChunks += index.metadata.totalChunks;

						// Count unique files from chunk files
						const uniqueFiles = new Set();
						for (const chunkFile of index.chunkFiles) {
							const chunkPath = path.join(folderFullPath, chunkFile);
							const chunkContent = await fs.readFile(chunkPath, "utf-8");
							const chunk = JSON.parse(chunkContent);
							uniqueFiles.add(chunk.metadata.fileName);
						}
						totalFiles += uniqueFiles.size;

						// Track latest update
						if (!lastUpdated || index.metadata.lastUpdated > lastUpdated) {
							lastUpdated = index.metadata.lastUpdated;
						}
					} catch {
						// Fall back to old format
						const index = await this.loadEmbeddingIndex(folderFullPath);
						if (index) {
							totalFolders++;
							totalChunks += index.metadata.totalChunks;

							// Count unique files
							const uniqueFiles = new Set(
								index.chunks.map((chunk) => chunk.metadata.fileName)
							);
							totalFiles += uniqueFiles.size;

							// Track latest update
							if (!lastUpdated || index.metadata.lastUpdated > lastUpdated) {
								lastUpdated = index.metadata.lastUpdated;
							}
						}
					}
				}
			}

			return {
				totalFolders,
				totalChunks,
				totalFiles,
				lastUpdated,
			};
		} catch (error) {
			console.error("Error getting global stats:", error);
			return {
				totalFolders: 0,
				totalChunks: 0,
				totalFiles: 0,
				lastUpdated: null,
			};
		}
	}
}
