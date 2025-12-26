import { openai } from "@ai-sdk/openai";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { requireOrgId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { findRelevantChunks } from "@/lib/document-chunking";
import {
  extractMessageContent,
  truncateContext,
  buildAnalysisContext,
} from "@/lib/chat-utils";

/**
 * Chat with Document API
 * 
 * POST /api/chat
 * 
 * Streams AI responses based on a document's content.
 * 
 * Body:
 * {
 *   messages: Array<{role: "user" | "assistant", content: string}>
 *   documentId: string (required) - ID of the document to chat about
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const clerkOrgId = await requireOrgId();
    const { messages, documentId }: { messages: UIMessage[]; documentId: string } = await req.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 }
      );
    }

    // Fetch document and verify it belongs to the organization
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        clerkOrgId,
      },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        aiAnalysis: true,
        extractionStatus: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found or access denied" },
        { status: 404 }
      );
    }

    // Get the latest user message (query) using utility function
    const userMessages = messages.filter((m) => m.role === "user");
    const latestMessage = userMessages[userMessages.length - 1];
    const latestQuery = extractMessageContent(latestMessage);

    if (!latestQuery || latestQuery.trim().length === 0) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Build context using RAG (Retrieval-Augmented Generation)
    let docContext = buildAnalysisContext(document.aiAnalysis);

    // Step 2: Use RAG to find relevant chunks (if document was indexed)
    let relevantChunksText = "";
    let sourceCitations: string[] = [];

    if (document.extractionStatus === "COMPLETED") {
      try {
        // Fetch chunks for this document (with potential metadata filtering)
        const chunks = await prisma.documentChunk.findMany({
          where: {
            documentId: document.id,
            // Could add filters here based on query intent
            // e.g., pageStart: { gte: targetPage } if query mentions specific page
          },
          orderBy: { chunkIndex: "asc" },
          // Limit to reasonable number for performance
          take: 1000, // Max chunks to consider
        });

        if (chunks.length > 0) {
          // Generate embedding for the user's query
          const openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
          });

          const queryEmbeddingResponse = await openaiClient.embeddings.create({
            model: "text-embedding-3-small",
            input: latestQuery,
          });

          const queryEmbedding = queryEmbeddingResponse.data[0]?.embedding;

          if (queryEmbedding) {
            // Find relevant chunks using vector similarity
            const chunksWithEmbeddings = chunks.map((chunk: any) => ({
              ...chunk,
              embedding: (chunk.embedding as number[]) || [],
            }));

            const relevant = findRelevantChunks(
              queryEmbedding,
              chunksWithEmbeddings,
              5, // top 5 chunks
              0.5 // minimum similarity threshold
            );

            // Build context from relevant chunks
            if (relevant.length > 0) {
              relevantChunksText = "\n\nΣχετικά αποσπάσματα από το έγγραφο:\n\n";
              relevant.forEach((item, idx) => {
                const chunk = item.chunk as any;
                const pageInfo =
                  chunk.pageStart && chunk.pageEnd
                    ? ` (σελίδες ${chunk.pageStart}-${chunk.pageEnd})`
                    : chunk.pageStart
                      ? ` (σελίδα ${chunk.pageStart})`
                      : "";

                relevantChunksText += `[Απόσπασμα ${idx + 1}${pageInfo}]:\n${chunk.text || ""}\n\n`;

                // Store citation
                if (chunk.pageStart) {
                  sourceCitations.push(
                    `Σελίδα ${chunk.pageStart}${chunk.pageEnd && chunk.pageEnd !== chunk.pageStart ? `-${chunk.pageEnd}` : ""}`
                  );
                }
              });
            }
          }
        }
      } catch (ragError) {
        console.error("RAG Error:", ragError);
        // Continue without RAG if it fails
      }
    }

    // Combine all context
    docContext += relevantChunksText;

    // Truncate context if too large (context window management)
    const { truncated: finalContext, wasTruncated } = truncateContext(docContext, 100000);

    // Build system prompt with context
    const systemPrompt = `Είσαι ο "360 Legal Assistant" - ένας εξειδικευμένος νομικός βοηθός. Σου δίνεται το παρακάτω νομικό κείμενο:
    
--- 
${finalContext}
---
${wasTruncated ? "\n[Σημείωση: Το έγγραφο είναι μεγάλο και έχει περικοπεί για να χωρέσει στο context window.]" : ""}

Οδηγίες:
1. Απάντησε ΜΟΝΟ βάσει του παραπάνω κειμένου. Μην προσθέτεις πληροφορίες που δεν υπάρχουν στο έγγραφο.
2. Αν η πληροφορία δεν υπάρχει στο έγγραφο, πες "Δεν αναφέρεται στο έγγραφο" ή "Αυτή η πληροφορία δεν είναι διαθέσιμη στο παρόν έγγραφο".
3. Χρησιμοποίησε νομική ορολογία αλλά εξήγησε την σύντομα αν χρειάζεται.
4. Έχε επαγγελματικό, φιλικό ύφος.
5. Αν ρωτάνε για ημερομηνίες ή προθεσμίες, να τις αναφέρεις με σαφήνεια.
6. Αν ρωτάνε για μέρη (ενάγων, εναγόμενος), να τα αναφέρεις με ακρίβεια.
7. Αν αναφέρονται σελίδες στα αποσπάσματα, μπορείς να τις αναφέρεις στην απάντησή σου για ακρίβεια.
8. **ΣΗΜΑΝΤΙΚΟ**: Αυτή η υπηρεσία δεν παρέχει νομικές συμβουλές. Είναι ένα εργαλείο βοήθειας για ανάλυση εγγράφων.

Απάντησε πάντα στα Ελληνικά, εκτός αν ο χρήστης ζητήσει ρητά απάντηση σε άλλη γλώσσα.`;

    // Stream AI response based on document context
    const result = streamText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages || []),
      temperature: 0.3, // Lower temperature for more accurate, consistent responses
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: error.message,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to process chat request",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

