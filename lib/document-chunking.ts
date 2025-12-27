/**
 * Document Chunking and Embedding Utilities
 * 
 * Splits documents into chunks and generates embeddings for RAG.
 * Implements minimal retention: chunks are processed but full text is not stored long-term.
 */

import OpenAI from "openai";

// Chunking configuration
const CHUNK_SIZE = 1000; // Characters per chunk
const CHUNK_OVERLAP = 200; // Overlap between chunks to preserve context

export interface DocumentChunk {
  text: string;
  chunkIndex: number;
  charStart: number;
  charEnd: number;
  pageStart?: number;
  pageEnd?: number;
}

export interface ChunkWithEmbedding extends DocumentChunk {
  embedding: number[];
  preview?: string; // First 500 chars for preview (optional)
}

/**
 * Splits document text into overlapping chunks
 */
export function chunkDocument(
  text: string,
  pageCount?: number
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  const textLength = text.length;

  if (textLength === 0) {
    return chunks;
  }

  // Safety limit: prevent creating more than 1 million chunks (should never happen)
  const MAX_CHUNKS = 1000000;
  let charStart = 0;
  let chunkIndex = 0;
  const MAX_ITERATIONS = 1000000; // Safety limit to prevent infinite loops
  let iterations = 0;

  while (charStart < textLength && iterations < MAX_ITERATIONS) {
    iterations++;
    const charEnd = Math.min(charStart + CHUNK_SIZE, textLength);

    // Try to break at sentence boundary (prefer . ! ? followed by space)
    let actualEnd = charEnd;
    if (charEnd < textLength) {
      const searchStart = Math.max(charStart + CHUNK_SIZE - 100, charStart);
      const searchEnd = Math.min(charEnd + 50, textLength);
      const searchText = text.substring(searchStart, searchEnd);

      // Find last sentence boundary
      const sentenceMatches = [...searchText.matchAll(/[.!?]\s+/g)];
      if (sentenceMatches.length > 0) {
        const lastMatch = sentenceMatches[sentenceMatches.length - 1];
        const matchPosition = searchStart + (lastMatch.index || 0);
        if (matchPosition > charStart + CHUNK_SIZE - 200) {
          actualEnd = matchPosition + 1;
        }
      }
    }

    // Ensure actualEnd is valid (must be >= charStart)
    if (actualEnd <= charStart) {
      actualEnd = charStart + 1; // Force at least 1 character advance
    }

    const chunkText = text.substring(charStart, actualEnd).trim();

    if (chunkText.length > 0) {
      // Estimate page numbers if available
      const pageStart = pageCount
        ? Math.floor((charStart / textLength) * pageCount) + 1
        : undefined;
      const pageEnd = pageCount
        ? Math.floor((actualEnd / textLength) * pageCount) + 1
        : undefined;

      // Safety check: prevent array from growing too large
      if (chunks.length >= MAX_CHUNKS) {
        break; // Exit loop to prevent further chunk creation
      }

      chunks.push({
        text: chunkText,
        chunkIndex,
        charStart,
        charEnd: actualEnd,
        pageStart,
        pageEnd,
      });
    }

    // Move to next chunk with overlap - ensure we always advance
    // Calculate next position: either overlap back from actualEnd, or advance by at least CHUNK_SIZE/2
    const nextStartFromOverlap = actualEnd - CHUNK_OVERLAP;
    const nextStartFromAdvance = charStart + Math.max(1, Math.floor(CHUNK_SIZE / 2));
    charStart = Math.max(nextStartFromOverlap, nextStartFromAdvance, charStart + 1);
    chunkIndex++;
  }

  return chunks;
}

/**
 * Generates embeddings for document chunks using OpenAI
 */
export async function generateEmbeddings(
  chunks: DocumentChunk[]
): Promise<ChunkWithEmbedding[]> {
  if (chunks.length === 0) {
    return [];
  }

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Generate embeddings in batches (OpenAI allows up to 2048 inputs per request)
  const batchSize = 100;
  const chunksWithEmbeddings: ChunkWithEmbedding[] = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);

    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small", // Cost-effective, good quality
        input: batch.map((chunk) => chunk.text),
      });

      // Combine chunks with their embeddings
      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        const embedding = response.data[j]?.embedding;

        if (!embedding) {
          console.warn(`No embedding generated for chunk ${j} in batch ${i}`);
          continue;
        }

        chunksWithEmbeddings.push({
          ...chunk,
          embedding: embedding,
          // Store first 500 chars as preview (optional, for debugging/preview)
          preview: chunk.text.substring(0, 500),
        });
      }
    } catch (error) {
      console.error(`Error generating embeddings for batch ${i}:`, error);
      throw error;
    }
  }

  return chunksWithEmbeddings;
}

/**
 * Calculates cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Finds most relevant chunks using vector similarity search
 */
export function findRelevantChunks(
  queryEmbedding: number[],
  chunks: Array<{ embedding: number[]; [key: string]: any }>,
  topK: number = 5,
  minSimilarity: number = 0.5
): Array<{ chunk: any; similarity: number }> {
  const similarities = chunks.map((chunk) => ({
    chunk,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  // Sort by similarity (descending) and filter by minimum threshold
  const relevant = similarities
    .filter((item) => item.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return relevant;
}

