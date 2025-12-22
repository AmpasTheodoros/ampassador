import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { requireOrgId } from "@/lib/auth";
import { LEGAL_AI_PROMPT } from "@/lib/ai-prompts";

/**
 * AI Document Analysis API
 * 
 * POST /api/ai/analyze-doc
 * 
 * Analyzes legal document text using specialized Greek legal AI prompt.
 * Returns structured data ready for database insertion.
 * 
 * Body:
 * {
 *   documentText: string (required) - The text content of the document to analyze
 * }
 * 
 * Returns structured analysis with:
 * - summary: Brief description in Greek
 * - parties: { plaintiff, defendant }
 * - criticalDates: Array of dates with events
 * - legalCategory: One of the Greek legal categories
 * - urgencyScore: 1-10 numeric score
 */

const analyzeDocSchema = z.object({
  documentText: z.string().min(10, "Document text must be at least 10 characters"),
});

// Schema for AI analysis output - matches the requirements
const legalAnalysisSchema = z.object({
  summary: z.string().describe("Μία παράγραφος που περιγράφει το επίδικο αντικείμενο στα Ελληνικά"),
  parties: z.object({
    plaintiff: z.string().describe("Ο ενάγων / αιτών").optional(),
    defendant: z.string().describe("Ο εναγόμενος / καθ' ου").optional(),
  }),
  criticalDates: z.array(
    z.object({
      date: z.string().describe("Ημερομηνία σε μορφή ISO 8601 (YYYY-MM-DD)"),
      event: z.string().describe("π.χ. Δικάσιμος, Κατάθεση προτάσεων, Προθεσμία 100 ημερών"),
    })
  ),
  legalCategory: z
    .enum(["ΑΣΤΙΚΟ", "ΠΟΙΝΙΚΟ", "ΕΜΠΟΡΙΚΟ", "ΔΙΟΙΚΗΤΙΚΟ", "ΕΡΓΑΤΙΚΟ"])
    .describe("Κατηγορία δικαίου που αφορά το έγγραφο"),
  urgencyScore: z
    .number()
    .min(1)
    .max(10)
    .describe("Επίπεδο επείγοντος: 1=χαμηλό, 10=πολύ επείγον (π.χ. κατάσχεση, πλειστηριασμός)"),
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate user and get organization ID
    await requireOrgId();

    // Parse and validate request body
    const body = await req.json();
    const validation = analyzeDocSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { documentText } = validation.data;

    // Limit document text to first 50 pages worth (~25,000 characters) for MVP
    // For production, implement RAG with vector search for larger documents
    const truncatedText =
      documentText.length > 25000 ? documentText.substring(0, 25000) + "..." : documentText;

    // AI Analysis using specialized Greek legal prompt
    const { object } = await generateObject({
      model: openai("gpt-4o"), // Use gpt-4o for better Greek legal understanding
      system: LEGAL_AI_PROMPT,
      schema: legalAnalysisSchema,
      prompt: `Ανάλυσε το εξής κείμενο νομικού εγγράφου:

${truncatedText}

Εξαγωγή πληροφοριών:
- Σύντομη περίληψη του επίδικου αντικειμένου
- Τα μέρη (ενάγων/αιτών και εναγόμενος/καθ' ου)
- Όλες οι κρίσιμες ημερομηνίες (δικάσιμοι, προθεσμίες, κ.λπ.)
- Η νομική κατηγορία (ΑΣΤΙΚΟ, ΠΟΙΝΙΚΟ, ΕΜΠΟΡΙΚΟ, ΔΙΟΙΚΗΤΙΚΟ, ΕΡΓΑΤΙΚΟ)
- Επίπεδο επείγοντος (1-10)`,
      temperature: 0.2, // Lower temperature for consistent extraction
    });

    return NextResponse.json({
      success: true,
      analysis: object,
      message: "Document analyzed successfully",
    });
  } catch (error) {
    console.error("AI Analysis Error:", error);

    // Handle auth errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: error.message,
        },
        { status: 401 }
      );
    }

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to analyze document",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/analyze-doc
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "AI Document Analysis API is active",
    endpoint: "POST /api/ai/analyze-doc",
    description: "Analyzes Greek legal documents using specialized AI prompt",
  });
}

