# PDF Extraction & RAG Implementation Guide

This document describes the new server-side PDF extraction and RAG (Retrieval-Augmented Generation) system that replaces the previous "vision-from-URL" approach.

## 🎯 What Changed

### Before
- ❌ Relied on GPT-4o vision to read PDFs from URLs (unreliable, requires public URLs)
- ❌ Chat only used pre-extracted summary (limited answers)
- ❌ No full document text access for detailed questions

### After
- ✅ **Server-side PDF extraction** using `pdf-parse` (deterministic, reliable)
- ✅ **RAG with vector search** - chat can answer questions from full document content
- ✅ **Minimal retention** - full text is NOT stored, only embeddings and metadata
- ✅ **Legal compliance** - reduced data exposure, better privacy controls

## 📋 Implementation Details

### Architecture

1. **Document Upload Flow**:
   ```
   Upload → Download to server → Extract text → Chunk → Generate embeddings → Store chunks (no full text) → Discard temp file
   ```

2. **Chat Flow**:
   ```
   User query → Generate query embedding → Vector search for relevant chunks → Use chunks as context → Generate answer with citations
   ```

### Storage Model (Minimal Retention)

**What IS stored:**
- `aiAnalysis` (JSON) - Structured summary, deadlines, parties, etc.
- `DocumentChunk` records:
  - Embeddings (vector arrays)
  - Chunk metadata (page numbers, character offsets)
  - Optional preview (first 500 chars per chunk)
- Document metadata (hash, page count, extraction status)

**What is NOT stored:**
- Full extracted text (discarded after chunking)
- Raw document content beyond preview snippets

This approach:
- ✅ Enables full-document Q&A via RAG
- ✅ Minimizes data breach impact
- ✅ Reduces GDPR/compliance obligations
- ✅ Allows document deduplication via hash

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

New dependencies added:
- `pdf-parse` - PDF text extraction
- `openai` - Direct OpenAI SDK for embeddings

### 2. Run Database Migration

The schema has been updated with:
- New fields on `Document` model (pageCount, extractionStatus, extractionError, textHash)
- New `DocumentChunk` model for storing embeddings

**Run the migration:**

```bash
# Generate Prisma client with new schema
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_document_chunks_and_extraction_metadata
```

Or if you prefer to push directly (development only):
```bash
npx prisma db push
```

### 3. Environment Variables

Ensure you have `OPENAI_API_KEY` set in your environment:

```bash
OPENAI_API_KEY=sk-...
```

This is used for:
- Generating embeddings (text-embedding-3-small)
- AI analysis (gpt-4o)

### 4. Verify Installation

1. Upload a PDF document through the UI
2. Check the console/logs for extraction status
3. Try asking a detailed question in the document chat

## 📊 Database Schema Changes

### Document Model (Updated)

```prisma
model Document {
  // ... existing fields ...
  pageCount       Int?     // Number of pages
  extractionStatus String?  // "PENDING", "COMPLETED", "FAILED", "SKIPPED"
  extractionError String?  // Error message if extraction failed
  textHash        String?  // SHA-256 hash for deduplication
  chunks         DocumentChunk[] // Relation to chunks
}
```

### DocumentChunk Model (New)

```prisma
model DocumentChunk {
  id          String   @id @default(cuid())
  documentId  String
  document    Document @relation(...)
  chunkIndex  Int      // Order in document
  text        String?  // Optional preview (first 500 chars), NOT full text
  embedding   Json     // Vector embedding array
  pageStart   Int?     // Starting page
  pageEnd     Int?     // Ending page
  charStart   Int?     // Character offset
  charEnd     Int?     // Character end offset
  createdAt   DateTime @default(now())
}
```

## 🔧 How It Works

### PDF Extraction (`lib/document-extraction.ts`)

1. Downloads file from URL to temporary location
2. Extracts text using `pdf-parse`
3. Calculates SHA-256 hash for deduplication
4. Detects scanned PDFs (image-based)
5. **Deletes temporary file immediately**

### Chunking (`lib/document-chunking.ts`)

1. Splits document into overlapping chunks (~1000 chars each, 200 char overlap)
2. Tries to break at sentence boundaries
3. Estimates page numbers for each chunk
4. Generates embeddings using OpenAI `text-embedding-3-small`

### RAG Chat (`app/api/chat/route.ts`)

1. Generates embedding for user query
2. Finds top 5 most relevant chunks using cosine similarity
3. Uses chunks + AI analysis as context for LLM
4. Returns answer with source citations (page numbers)

## 🛡️ Legal & Compliance Features

### Data Minimization
- Full text is **not stored** long-term
- Only embeddings and metadata retained
- Optional preview snippets (500 chars) for debugging

### Privacy Controls
- Text hash enables deduplication without storing content
- Extraction status tracking for audit
- Error logging without exposing sensitive data

### Future Enhancements (Optional)
- Per-tenant encryption keys
- Configurable retention policies
- OCR for scanned documents (opt-in)
- Redaction of PII before processing

## 🐛 Troubleshooting

### "Cannot find module 'openai'"
```bash
npm install openai
```

### "Property 'documentChunk' does not exist"
Run Prisma migration:
```bash
npx prisma generate
npx prisma migrate dev
```

### Extraction fails for certain PDFs
- Check if PDF is scanned (image-based) - currently not supported
- Verify file URL is accessible
- Check file size limits (16MB default)

### Chat doesn't find relevant chunks
- Verify document extraction status is "COMPLETED"
- Check that chunks were created (query `DocumentChunk` table)
- Lower similarity threshold in `findRelevantChunks` if needed

## 📝 API Changes

### POST /api/documents/parse

**Response now includes:**
```json
{
  "success": true,
  "document": {
    "pageCount": 10,
    "extractionStatus": "COMPLETED"
  },
  "chunksCreated": 15
}
```

### POST /api/chat

**No breaking changes** - now uses RAG internally for better answers.

## 🔮 Future Improvements

1. **OCR Support**: Add Tesseract or cloud OCR for scanned PDFs
2. **DOCX Support**: Add `mammoth` or similar for Word documents
3. **Hybrid Search**: Combine vector search with keyword search
4. **Chunk Re-indexing**: Allow re-processing documents if extraction improves
5. **Batch Processing**: Process multiple documents in background jobs

## 📚 References

- [pdf-parse documentation](https://www.npmjs.com/package/pdf-parse)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [RAG (Retrieval-Augmented Generation)](https://www.pinecone.io/learn/retrieval-augmented-generation/)

