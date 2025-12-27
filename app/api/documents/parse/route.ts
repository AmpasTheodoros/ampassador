import { requireOrgId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { LEGAL_AI_PROMPT } from "@/lib/ai-prompts";
import { extractDocumentText, isLikelyScannedPdf } from "@/lib/document-extraction";
import { chunkDocument, generateEmbeddings } from "@/lib/document-chunking";
import {
  createDeadlinesFromAnalysis,
  validateFileUrl,
  validateAiAnalysis,
} from "@/lib/document-utils";

/**
 * Document Parsing API
 * 
 * POST /api/documents/parse
 * 
 * Analyzes legal documents (PDF, DOCX, etc.) using AI to extract:
 * - Deadlines and dates
 * - Involved parties
 * - Summary
 * - Urgency level
 * 
 * Body:
 * {
 *   fileUrl: string (required) - URL of the uploaded document
 *   fileName: string (required) - Original filename
 *   matterId?: string (optional) - Link document to a specific Matter
 *   fileSize?: number (optional) - File size in bytes
 *   fileType?: string (optional) - MIME type (e.g., "application/pdf")
 * }
 * 
 * Returns the created Document with AI analysis
 */

const documentParseSchema = z.object({
  fileUrl: z.string().url("Invalid file URL"),
  fileName: z.string().min(1, "File name is required"),
  matterId: z.string().optional(),
  fileSize: z.number().optional(),
  fileType: z.string().optional(),
});

// Schema for AI analysis output - Enhanced with Greek legal categories
const aiAnalysisSchema = z.object({
  summary: z.string().describe("Μία παράγραφος που περιγράφει το επίδικο αντικείμενο στα Ελληνικά"),
  deadlines: z
    .array(
      z.object({
        date: z.string().describe("Ημερομηνία σε μορφή ISO 8601 (YYYY-MM-DD)"),
        description: z.string().describe("Περιγραφή της προθεσμίας (π.χ. 'Ανακοπή δίκης', 'Υποβολή ένδικων μέσων', 'Δικάσιμος')"),
      })
    )
    .describe("Λίστα με όλες τις ημερομηνίες προθεσμιών ή δικασίμων που βρέθηκαν στο έγγραφο"),
  parties: z.object({
    plaintiff: z.string().nullable().describe("Ο ενάγων / αιτών"),
    defendant: z.string().nullable().describe("Ο εναγόμενος / καθ' ου"),
    others: z.array(z.string()).nullable().describe("Άλλα μέρη (δικαστές, μάρτυρες, κ.λπ.)"),
  }),
  legalCategory: z
    .enum(["ΑΣΤΙΚΟ", "ΠΟΙΝΙΚΟ", "ΕΜΠΟΡΙΚΟ", "ΔΙΟΙΚΗΤΙΚΟ", "ΕΡΓΑΤΙΚΟ"])
    .nullable()
    .describe("Κατηγορία δικαίου που αφορά το έγγραφο"),
  urgency: z
    .enum(["LOW", "MEDIUM", "HIGH"])
    .describe("Επίπεδο επείγοντος: LOW (χαμηλό), MEDIUM (μέτριο), HIGH (υψηλό - π.χ. κατάσχεση, πλειστηριασμός)"),
  urgencyScore: z
    .number()
    .min(1)
    .max(10)
    .nullable()
    .describe("Αριθμητικό επίπεδο επείγοντος: 1=χαμηλό, 10=πολύ επείγον"),
  keyPoints: z
    .array(z.string())
    .nullable()
    .describe("Βασικά νομικά σημεία ή θέματα που αναφέρονται στο έγγραφο"),
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate user and get organization ID
    const clerkOrgId = await requireOrgId();

    // Parse and validate request body
    const body = await req.json();
    const validation = documentParseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { fileUrl, fileName, matterId, fileSize, fileType } = validation.data;

    // Validate file URL security
    const urlValidation = validateFileUrl(fileUrl);
    if (!urlValidation.valid) {
      return NextResponse.json(
        {
          error: "Invalid file URL",
          message: urlValidation.error,
        },
        { status: 400 }
      );
    }

    // Verify firm exists
    const firm = await prisma.firm.findUnique({
      where: { clerkOrgId },
      select: { id: true, name: true },
    });

    if (!firm) {
      return NextResponse.json(
        { error: "Firm not found. Please ensure you are part of an organization." },
        { status: 404 }
      );
    }

    // If matterId is provided, verify it exists and belongs to the organization
    if (matterId) {
      const matter = await prisma.matter.findFirst({
        where: {
          id: matterId,
          clerkOrgId,
        },
      });

      if (!matter) {
        return NextResponse.json(
          { error: "Matter not found or does not belong to your organization." },
          { status: 404 }
        );
      }
    }

    // Step 1: Extract text from document (server-side, deterministic)
    let extractedText: string | null = null;
    let pageCount: number | null = null;
    let textHash: string | null = null;
    let extractionStatus = "PENDING";
    let extractionError: string | null = null;

    try {
      const extracted = await extractDocumentText(fileUrl, fileType || undefined);
      extractedText = extracted.text;
      pageCount = extracted.pageCount;
      textHash = extracted.hash;
      extractionStatus = "COMPLETED";

      // Check if PDF is likely scanned (image-based)
      if (fileType?.includes("pdf") && isLikelyScannedPdf(extractedText, fileSize || undefined)) {
        extractionError = "Document appears to be scanned (image-based). OCR not yet implemented.";
        // Continue with limited text extraction
      }
    } catch (extractionError_) {
      console.error("Text Extraction Error:", extractionError_);
      extractionStatus = "FAILED";
      extractionError =
        extractionError_ instanceof Error
          ? extractionError_.message
          : "Failed to extract text from document";
      // Continue without text extraction - document will be saved but without chunks
    }

    // Step 2: AI Analysis using extracted text (not URL)
    let aiAnalysis: z.infer<typeof aiAnalysisSchema> | null = null;

    if (extractedText && extractedText.length > 50) {
      try {
        // Limit text for analysis to first 50,000 chars (cost optimization)
        const textForAnalysis =
          extractedText.length > 50000
            ? extractedText.substring(0, 50000) + "\n\n[... έγγραφο συνεχίζεται ...]"
            : extractedText;

        const { object } = await generateObject({
          model: openai("gpt-4o"), // Use gpt-4o for better Greek legal understanding
          system: LEGAL_AI_PROMPT,
          schema: aiAnalysisSchema,
          prompt: `Ανάλυσε το εξής κείμενο νομικού εγγράφου:

${textForAnalysis}

Εξαγωγή πληροφοριών:
1. Περίληψη: Μία παράγραφος που περιγράφει το επίδικο αντικείμενο
2. Ημερομηνίες: Βρες όλες τις κρίσιμες ημερομηνίες (προθεσμίες, δικασίμες, δικάσιμες, συνεδριάσεις, κ.λπ.)
   - Χρησιμοποίησε ISO 8601 format (YYYY-MM-DD)
   - Αν μια ημερομηνία δεν είναι σαφής, μην την υποθέσεις
3. Μέρη: Εξάγει τα μέρη (ενάγων/αιτών, εναγόμενος/καθ' ου, και άλλα)
4. Κατηγορία: Καθορίσε τη νομική κατηγορία (ΑΣΤΙΚΟ, ΠΟΙΝΙΚΟ, ΕΜΠΟΡΙΚΟ, ΔΙΟΙΚΗΤΙΚΟ, ΕΡΓΑΤΙΚΟ)
5. Επείγον: Κατάταξε το επίπεδο επείγοντος (LOW/MEDIUM/HIGH) και urgencyScore (1-10)
   - HIGH: Αν υπάρχουν λέξεις όπως "κατάσχεση", "πλειστηριασμός", "ασφαλιστικά μέτρα"`,
          temperature: 0.2, // Lower temperature for more consistent extraction
        });

        // Validate AI response
        const validation = validateAiAnalysis(object, aiAnalysisSchema);
        if (!validation.valid) {
          console.error("AI returned invalid data:", validation.error);
          // Continue without analysis rather than failing completely
        } else {
          aiAnalysis = validation.data;
        }
      } catch (aiError) {
        console.error("AI Analysis Error:", aiError);
        // Continue without AI analysis if it fails
      }
    } else if (extractedText === null) {
      extractionStatus = "SKIPPED";
      extractionError = "Text extraction not attempted or failed";
    }

    // Step 3: Chunk document and generate embeddings (if text was extracted)
    let chunksCreated = 0;
    if (extractedText && extractedText.length > 100) {
      try {
        // Chunk the document
        const chunks = chunkDocument(extractedText, pageCount || undefined);

        if (chunks.length > 0) {
          // Generate embeddings
          const chunksWithEmbeddings = await generateEmbeddings(chunks);

          // Create document record first (needed for foreign key)
          const document = await prisma.document.create({
            data: {
              clerkOrgId,
              matterId: matterId || null,
              fileName,
              fileUrl,
              fileSize: fileSize || null,
              fileType: fileType || null,
              aiAnalysis: aiAnalysis ? (aiAnalysis as any) : null,
              pageCount,
              extractionStatus,
              extractionError,
              textHash,
            },
            include: {
              matter: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          });

          // Store chunks (WITHOUT full text - minimal retention)
          // Only store embeddings, metadata, and optional preview
          await prisma.documentChunk.createMany({
            data: chunksWithEmbeddings.map((chunk) => ({
              documentId: document.id,
              chunkIndex: chunk.chunkIndex,
              text: chunk.preview || null, // Only store preview (first 500 chars), not full text
              embedding: chunk.embedding as any, // Store as JSON
              pageStart: chunk.pageStart || null,
              pageEnd: chunk.pageEnd || null,
              charStart: chunk.charStart,
              charEnd: chunk.charEnd,
            })),
          });

          chunksCreated = chunksWithEmbeddings.length;

          // Create deadlines using utility function (DRY)
          const createdDeadlines = await createDeadlinesFromAnalysis({
            aiAnalysis,
            documentId: document.id,
            clerkOrgId,
            matterId: matterId || null,
            fileName,
          });

          return NextResponse.json(
            {
              success: true,
              document: {
                id: document.id,
                fileName: document.fileName,
                fileUrl: document.fileUrl,
                matterId: document.matterId,
                aiAnalysis: document.aiAnalysis,
                pageCount: document.pageCount,
                extractionStatus: document.extractionStatus,
                createdAt: document.createdAt,
                matter: document.matter,
              },
              chunksCreated,
              deadlinesCreated: createdDeadlines.length,
              deadlines: createdDeadlines.map((d) => ({
                id: d.id,
                title: d.title,
                dueDate: d.dueDate,
                status: d.status,
              })),
              message: "Document parsed, analyzed, and indexed successfully",
              warning:
                chunksCreated === 0 && extractionStatus === "COMPLETED"
                  ? "Document saved but chat functionality will be limited - chunking failed"
                  : undefined,
            },
            { status: 201 }
          );
        }
      } catch (chunkError) {
        console.error("Chunking/Embedding Error:", chunkError);
        // Continue to create document without chunks
      }
    }

    // Fallback: Create document without chunks (if extraction/chunking failed)
    const document = await prisma.document.create({
      data: {
        clerkOrgId,
        matterId: matterId || null,
        fileName,
        fileUrl,
        fileSize: fileSize || null,
        fileType: fileType || null,
        aiAnalysis: aiAnalysis ? (aiAnalysis as any) : null,
        pageCount,
        extractionStatus,
        extractionError,
        textHash,
      },
      include: {
        matter: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Create deadlines using utility function (DRY - no duplication)
    const createdDeadlines = await createDeadlinesFromAnalysis({
      aiAnalysis,
      documentId: document.id,
      clerkOrgId,
      matterId: matterId || null,
      fileName,
    });

    return NextResponse.json(
      {
        success: true,
        document: {
          id: document.id,
          fileName: document.fileName,
          fileUrl: document.fileUrl,
          matterId: document.matterId,
          aiAnalysis: document.aiAnalysis,
          pageCount: document.pageCount,
          extractionStatus: document.extractionStatus,
          createdAt: document.createdAt,
          matter: document.matter,
        },
        chunksCreated,
        deadlinesCreated: createdDeadlines.length,
        deadlines: createdDeadlines.map((d) => ({
          id: d.id,
          title: d.title,
          dueDate: d.dueDate,
          status: d.status,
        })),
        message: extractionStatus === "COMPLETED"
          ? "Document parsed, analyzed, and indexed successfully"
          : `Document saved but extraction ${extractionStatus.toLowerCase()}. ${extractionError || ""}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Document Parse Error:", error);

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
        error: "Failed to parse document",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/documents/parse
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Document Parsing API is active",
    endpoint: "POST /api/documents/parse",
  });
}

