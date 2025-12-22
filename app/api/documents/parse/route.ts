import { requireOrgId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { LEGAL_AI_PROMPT } from "@/lib/ai-prompts";

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
    plaintiff: z.string().describe("Ο ενάγων / αιτών").optional(),
    defendant: z.string().describe("Ο εναγόμενος / καθ' ου").optional(),
    others: z.array(z.string()).optional().describe("Άλλα μέρη (δικαστές, μάρτυρες, κ.λπ.)"),
  }),
  legalCategory: z
    .enum(["ΑΣΤΙΚΟ", "ΠΟΙΝΙΚΟ", "ΕΜΠΟΡΙΚΟ", "ΔΙΟΙΚΗΤΙΚΟ", "ΕΡΓΑΤΙΚΟ"])
    .optional()
    .describe("Κατηγορία δικαίου που αφορά το έγγραφο"),
  urgency: z
    .enum(["LOW", "MEDIUM", "HIGH"])
    .describe("Επίπεδο επείγοντος: LOW (χαμηλό), MEDIUM (μέτριο), HIGH (υψηλό - π.χ. κατάσχεση, πλειστηριασμός)"),
  urgencyScore: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .describe("Αριθμητικό επίπεδο επείγοντος: 1=χαμηλό, 10=πολύ επείγον"),
  keyPoints: z
    .array(z.string())
    .optional()
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

    // AI Analysis: Extract structured data from the document
    let aiAnalysis: z.infer<typeof aiAnalysisSchema> | null = null;

    try {
      const { object } = await generateObject({
        model: openai("gpt-4o"), // Use gpt-4o for better Greek legal understanding
        system: LEGAL_AI_PROMPT,
        schema: aiAnalysisSchema,
        prompt: `Ανάλυσε αυτό το νομικό έγγραφο (PDF, DOCX, ή άλλο) από το URL: ${fileUrl}

Εξαγωγή πληροφοριών:
1. Περίληψη: Μία παράγραφος που περιγράφει το επίδικο αντικείμενο
2. Ημερομηνίες: Βρες όλες τις κρίσιμες ημερομηνίες (προθεσμίες, δικασίμες, δικάσιμες, συνεδριάσεις, κ.λπ.)
   - Χρησιμοποίησε ISO 8601 format (YYYY-MM-DD)
   - Αν μια ημερομηνία δεν είναι σαφής, μην την υποθέσεις
3. Μέρη: Εξάγει τα μέρη (ενάγων/αιτών, εναγόμενος/καθ' ου, και άλλα)
4. Κατηγορία: Καθορίσε τη νομική κατηγορία (ΑΣΤΙΚΟ, ΠΟΙΝΙΚΟ, ΕΜΠΟΡΙΚΟ, ΔΙΟΙΚΗΤΙΚΟ, ΕΡΓΑΤΙΚΟ)
5. Επείγον: Κατάταξε το επίπεδο επείγοντος (LOW/MEDIUM/HIGH) και urgencyScore (1-10)
   - HIGH: Αν υπάρχουν λέξεις όπως "κατάσχεση", "πλειστηριασμός", "ασφαλιστικά μέτρα"

Αν το έγγραφο δεν είναι προσβάσιμο ή δεν μπορεί να διαβαστεί, επέστρεψε κενές τιμές.`,
        temperature: 0.2, // Lower temperature for more consistent extraction
      });

      aiAnalysis = object;
    } catch (aiError) {
      console.error("AI Analysis Error:", aiError);
      // Continue without AI analysis if it fails - document will be saved without analysis
      // This allows the document to be uploaded even if AI parsing fails
    }

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        clerkOrgId,
        matterId: matterId || null,
        fileName,
        fileUrl,
        fileSize: fileSize || null,
        fileType: fileType || null,
        aiAnalysis: aiAnalysis ? (aiAnalysis as any) : null,
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

    // Extract deadlines and create Deadline records
    const createdDeadlines = [];
    if (aiAnalysis?.deadlines && aiAnalysis.deadlines.length > 0) {
      for (const deadlineData of aiAnalysis.deadlines) {
        try {
          // Parse the date string to DateTime
          const dueDate = new Date(deadlineData.date);
          
          // Skip if date is invalid
          if (isNaN(dueDate.getTime())) {
            console.warn(`Invalid date format: ${deadlineData.date}`);
            continue;
          }

          // Determine status based on due date
          const now = new Date();
          const status = dueDate < now ? "OVERDUE" : "PENDING";

          const deadline = await prisma.deadline.create({
            data: {
              clerkOrgId,
              matterId: matterId || null,
              documentId: document.id,
              title: deadlineData.description,
              dueDate,
              description: `Εξήχθη αυτόματα από το έγγραφο: ${fileName}`,
              status,
            },
          });

          createdDeadlines.push(deadline);
        } catch (deadlineError) {
          console.error("Error creating deadline:", deadlineError);
          // Continue with other deadlines even if one fails
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        document: {
          id: document.id,
          fileName: document.fileName,
          fileUrl: document.fileUrl,
          matterId: document.matterId,
          aiAnalysis: document.aiAnalysis,
          createdAt: document.createdAt,
          matter: document.matter,
        },
        deadlinesCreated: createdDeadlines.length,
        deadlines: createdDeadlines.map((d) => ({
          id: d.id,
          title: d.title,
          dueDate: d.dueDate,
          status: d.status,
        })),
        message: "Document parsed and analyzed successfully",
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

