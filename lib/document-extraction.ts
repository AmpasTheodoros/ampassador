/**
 * Document Extraction Utilities
 * 
 * Server-side PDF text extraction with minimal retention.
 * Downloads file, extracts text, then discards the temporary file.
 * 
 * Legal compliance: No full text is stored long-term, only embeddings and metadata.
 */

import pdfParse from "pdf-parse";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import { tmpdir } from "os";

export interface ExtractedDocument {
  text: string;
  pageCount: number;
  hash: string; // SHA-256 hash for deduplication
}

/**
 * Downloads a file from URL to temporary location
 */
async function downloadFile(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  const tempPath = path.join(tmpdir(), `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`);

  try {
    fs.writeFileSync(tempPath, Buffer.from(buffer));
    return tempPath;
  } catch (error) {
    // Clean up partial file if it exists
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
    throw error;
  }
}

/**
 * Extracts text from PDF file
 */
async function extractPdfText(filePath: string): Promise<{ text: string; pageCount: number }> {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);

  return {
    text: data.text,
    pageCount: data.numpages,
  };
}

/**
 * Calculates SHA-256 hash of text for deduplication
 */
function calculateTextHash(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

/**
 * Main extraction function
 * Downloads file, extracts text, calculates hash, then deletes temp file
 * 
 * @param fileUrl - URL of the document to extract
 * @param fileType - MIME type (e.g., "application/pdf")
 * @returns Extracted text, page count, and hash
 */
export async function extractDocumentText(
  fileUrl: string,
  fileType?: string
): Promise<ExtractedDocument> {
  let tempPath: string | null = null;

  try {
    // Download file to temporary location
    tempPath = await downloadFile(fileUrl);

    // Extract text based on file type
    let text: string;
    let pageCount: number = 0;

    if (fileType?.includes("pdf") || fileUrl.toLowerCase().endsWith(".pdf")) {
      const result = await extractPdfText(tempPath);
      text = result.text;
      pageCount = result.pageCount;
    } else if (
      fileType?.includes("text") ||
      fileType?.includes("plain") ||
      fileUrl.toLowerCase().endsWith(".txt")
    ) {
      // For text files, read directly
      text = fs.readFileSync(tempPath, "utf-8");
      pageCount = Math.ceil(text.length / 2000); // Approximate pages (2000 chars/page)
    } else {
      // For DOCX and other formats, we'd need additional libraries
      // For now, return empty text and mark as unsupported
      throw new Error(
        `Unsupported file type: ${fileType || "unknown"}. Currently only PDF and TXT are supported.`
      );
    }

    // Calculate hash for deduplication
    const hash = calculateTextHash(text);

    return {
      text,
      pageCount,
      hash,
    };
  } catch (error) {
    throw error;
  } finally {
    // Always clean up temporary file
    if (tempPath && fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch (error) {
        console.error("Failed to delete temporary file:", error);
      }
    }
  }
}

/**
 * Detects if PDF is scanned (image-based) vs text-based
 * Simple heuristic: if extracted text is very short relative to file size, likely scanned
 */
export function isLikelyScannedPdf(text: string, fileSizeBytes?: number): boolean {
  if (!fileSizeBytes) return false;
  
  // If text is less than 1% of file size, likely scanned
  const textSizeBytes = Buffer.byteLength(text, "utf-8");
  return textSizeBytes < fileSizeBytes * 0.01;
}

