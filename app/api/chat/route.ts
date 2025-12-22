import { openai } from "@ai-sdk/openai";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { requireOrgId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found or access denied" },
        { status: 404 }
      );
    }

    // Get document content
    // For MVP: We'll use the AI analysis we already have, and reference the file URL
    // In production, you can store extracted text in the database for better performance
    let docContext = "";
    
    // Build context from AI analysis if available
    if (document.aiAnalysis && typeof document.aiAnalysis === 'object') {
      const analysis = document.aiAnalysis as any;
      
      if (analysis.summary) {
        docContext += `Περίληψη: ${analysis.summary}\n\n`;
      }
      
      if (analysis.deadlines && Array.isArray(analysis.deadlines)) {
        docContext += `Προθεσμίες:\n`;
        analysis.deadlines.forEach((d: any) => {
          docContext += `- ${d.date}: ${d.description}\n`;
        });
        docContext += `\n`;
      }
      
      if (analysis.parties) {
        docContext += `Μέρη:\n`;
        if (analysis.parties.plaintiff) {
          docContext += `- Ενάγων/Αιτών: ${analysis.parties.plaintiff}\n`;
        }
        if (analysis.parties.defendant) {
          docContext += `- Εναγόμενος/Καθ' ου: ${analysis.parties.defendant}\n`;
        }
        if (analysis.parties.others && Array.isArray(analysis.parties.others)) {
          analysis.parties.others.forEach((p: string) => {
            docContext += `- ${p}\n`;
          });
        }
        docContext += `\n`;
      }
      
      if (analysis.keyPoints && Array.isArray(analysis.keyPoints)) {
        docContext += `Βασικά σημεία:\n`;
        analysis.keyPoints.forEach((point: string) => {
          docContext += `- ${point}\n`;
        });
        docContext += `\n`;
      }
    }
    
    // Add file reference for AI to potentially access
    docContext += `\nΤο πλήρες έγγραφο είναι διαθέσιμο στο: ${document.fileName}`;
    
    // For more detailed questions, we can instruct the AI to reference the file URL
    // This allows the AI to potentially read more details if needed

    // Stream AI response based on document context
    const result = streamText({
      model: openai("gpt-4o"),
      system: `Είσαι ο "360 Legal Assistant" - ένας εξειδικευμένος νομικός βοηθός. Σου δίνεται το παρακάτω νομικό κείμενο:
    
--- 
${docContext}
---

Οδηγίες:
1. Απάντησε ΜΟΝΟ βάσει του παραπάνω κειμένου. Μην προσθέτεις πληροφορίες που δεν υπάρχουν στο έγγραφο.
2. Αν η πληροφορία δεν υπάρχει στο έγγραφο, πες "Δεν αναφέρεται στο έγγραφο" ή "Αυτή η πληροφορία δεν είναι διαθέσιμη στο παρόν έγγραφο".
3. Χρησιμοποίησε νομική ορολογία αλλά εξήγησε την σύντομα αν χρειάζεται.
4. Έχε επαγγελματικό, φιλικό ύφος.
5. Αν ρωτάνε για ημερομηνίες ή προθεσμίες, να τις αναφέρεις με σαφήνεια.
6. Αν ρωτάνε για μέρη (ενάγων, εναγόμενος), να τα αναφέρεις με ακρίβεια.

Απάντησε πάντα στα Ελληνικά, εκτός αν ο χρήστης ζητήσει ρητά απάντηση σε άλλη γλώσσα.`,
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

