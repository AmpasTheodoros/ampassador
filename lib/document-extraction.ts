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
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/6afa769e-192d-4199-a412-22d081d7b25f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'document-extraction.ts:25',message:'downloadFile entry',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const response = await fetch(url);
  if (!response.ok) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6afa769e-192d-4199-a412-22d081d7b25f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'document-extraction.ts:28',message:'downloadFile response not ok',data:{status:response.status,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    throw new Error(`Failed to download file: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/6afa769e-192d-4199-a412-22d081d7b25f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'document-extraction.ts:32',message:'downloadFile buffer received',data:{bufferSize:buffer.byteLength},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const tempPath = path.join(tmpdir(), `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`);
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/6afa769e-192d-4199-a412-22d081d7b25f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'document-extraction.ts:34',message:'downloadFile before writeFileSync',data:{tempPath,bufferSize:buffer.byteLength},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  try {
    fs.writeFileSync(tempPath, Buffer.from(buffer));
    // #region agent log
    const fileExists = fs.existsSync(tempPath);
    const fileStats = fileExists ? fs.statSync(tempPath) : null;
    fetch('http://127.0.0.1:7243/ingest/6afa769e-192d-4199-a412-22d081d7b25f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'document-extraction.ts:36',message:'downloadFile after writeFileSync',data:{tempPath,fileExists,fileSize:fileStats?.size,bufferSize:buffer.byteLength},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    return tempPath;
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6afa769e-192d-4199-a412-22d081d7b25f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'document-extraction.ts:49',message:'downloadFile writeFileSync error',data:{error:error instanceof Error ? error.message : String(error),tempPath},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
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
  // #region agent log
  const fileExistsBefore = fs.existsSync(filePath);
  const fileStatsBefore = fileExistsBefore ? fs.statSync(filePath) : null;
  fetch('http://127.0.0.1:7243/ingest/6afa769e-192d-4199-a412-22d081d7b25f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'document-extraction.ts:42',message:'extractPdfText entry',data:{filePath,fileExists:fileExistsBefore,fileSize:fileStatsBefore?.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const dataBuffer = fs.readFileSync(filePath);
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/6afa769e-192d-4199-a412-22d081d7b25f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'document-extraction.ts:44',message:'extractPdfText after readFileSync',data:{filePath,bufferSize:dataBuffer.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const data = await pdfParse(dataBuffer);
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/6afa769e-192d-4199-a412-22d081d7b25f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'document-extraction.ts:46',message:'extractPdfText after pdfParse',data:{textLength:data.text?.length,pageCount:data.numpages},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

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
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/6afa769e-192d-4199-a412-22d081d7b25f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'document-extraction.ts:66',message:'extractDocumentText entry',data:{fileUrl,fileType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  let tempPath: string | null = null;

  try {
    // Download file to temporary location
    tempPath = await downloadFile(fileUrl);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6afa769e-192d-4199-a412-22d081d7b25f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'document-extraction.ts:75',message:'extractDocumentText after downloadFile',data:{tempPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Extract text based on file type
    let text: string;
    let pageCount: number = 0;

    if (fileType?.includes("pdf") || fileUrl.toLowerCase().endsWith(".pdf")) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6afa769e-192d-4199-a412-22d081d7b25f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'document-extraction.ts:81',message:'extractDocumentText before extractPdfText',data:{tempPath,fileType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const result = await extractPdfText(tempPath);
      text = result.text;
      pageCount = result.pageCount;
    } else if (
      fileType?.includes("text") ||
      fileType?.includes("plain") ||
      fileUrl.toLowerCase().endsWith(".txt")
    ) {
      // For text files, read directly
      // #region agent log
      const fileExistsBeforeRead = fs.existsSync(tempPath);
      fetch('http://127.0.0.1:7243/ingest/6afa769e-192d-4199-a412-22d081d7b25f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'document-extraction.ts:90',message:'extractDocumentText before text file read',data:{tempPath,fileExists:fileExistsBeforeRead},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6afa769e-192d-4199-a412-22d081d7b25f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'document-extraction.ts:101',message:'extractDocumentText before return',data:{textLength:text.length,pageCount,hash},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    return {
      text,
      pageCount,
      hash,
    };
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6afa769e-192d-4199-a412-22d081d7b25f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'document-extraction.ts:108',message:'extractDocumentText error caught',data:{error:error instanceof Error ? error.message : String(error),tempPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    throw error;
  } finally {
    // Always clean up temporary file
    // #region agent log
    const fileExistsBeforeCleanup = tempPath ? fs.existsSync(tempPath) : false;
    fetch('http://127.0.0.1:7243/ingest/6afa769e-192d-4199-a412-22d081d7b25f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'document-extraction.ts:115',message:'extractDocumentText finally block',data:{tempPath,fileExists:fileExistsBeforeCleanup},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (tempPath && fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6afa769e-192d-4199-a412-22d081d7b25f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'document-extraction.ts:118',message:'extractDocumentText file deleted',data:{tempPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6afa769e-192d-4199-a412-22d081d7b25f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'document-extraction.ts:120',message:'extractDocumentText cleanup error',data:{error:error instanceof Error ? error.message : String(error),tempPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
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

