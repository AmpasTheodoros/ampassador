/**
 * Document Processing Utilities
 * Shared functions for document parsing and deadline creation
 */

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { DeadlineStatus } from "@prisma/client";

// Define the schema here to avoid circular imports
const deadlineSchema = z.object({
  date: z.string(),
  description: z.string(),
});

const aiAnalysisSchema = z.object({
  summary: z.string(),
  deadlines: z.array(deadlineSchema).optional(),
  parties: z
    .object({
      plaintiff: z.string().optional(),
      defendant: z.string().optional(),
      others: z.array(z.string()).optional(),
    })
    .optional(),
  legalCategory: z
    .enum(["ΑΣΤΙΚΟ", "ΠΟΙΝΙΚΟ", "ΕΜΠΟΡΙΚΟ", "ΔΙΟΙΚΗΤΙΚΟ", "ΕΡΓΑΤΙΚΟ"])
    .optional(),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  urgencyScore: z.number().min(1).max(10).optional(),
  keyPoints: z.array(z.string()).optional(),
});

type AiAnalysis = z.infer<typeof aiAnalysisSchema>;

interface CreateDeadlinesParams {
  aiAnalysis: AiAnalysis | null;
  documentId: string;
  clerkOrgId: string;
  matterId: string | null;
  fileName: string;
}

/**
 * Creates deadline records from AI analysis
 * Uses createMany for better performance
 */
export async function createDeadlinesFromAnalysis({
  aiAnalysis,
  documentId,
  clerkOrgId,
  matterId,
  fileName,
}: CreateDeadlinesParams) {
  if (!aiAnalysis?.deadlines || aiAnalysis.deadlines.length === 0) {
    return [];
  }

  const now = new Date();
  const deadlinesToCreate = [];

  for (const deadlineData of aiAnalysis.deadlines) {
    try {
      const dueDate = new Date(deadlineData.date);
      if (isNaN(dueDate.getTime())) {
        console.warn(`Invalid date format: ${deadlineData.date}`);
        continue;
      }

      const status: DeadlineStatus = dueDate < now ? DeadlineStatus.OVERDUE : DeadlineStatus.PENDING;

      deadlinesToCreate.push({
        clerkOrgId,
        matterId: matterId || null,
        documentId,
        title: deadlineData.description,
        dueDate,
        description: `Εξήχθη αυτόματα από το έγγραφο: ${fileName}`,
        status,
      });
    } catch (error) {
      console.error("Error preparing deadline:", error);
    }
  }

  if (deadlinesToCreate.length === 0) {
    return [];
  }

  // Use createMany for better performance
  try {
    await prisma.deadline.createMany({
      data: deadlinesToCreate,
      skipDuplicates: true, // Skip if duplicate dates/descriptions exist
    });

    // Fetch created deadlines to return their IDs
    const createdDeadlines = await prisma.deadline.findMany({
      where: {
        documentId,
        clerkOrgId,
        title: { in: deadlinesToCreate.map((d) => d.title) },
      },
      orderBy: { dueDate: "asc" },
    });

    return createdDeadlines;
  } catch (error) {
    console.error("Error creating deadlines:", error);
    return [];
  }
}

/**
 * Validates file URL is from allowed storage providers
 */
export function validateFileUrl(fileUrl: string): { valid: boolean; error?: string } {
  try {
    const url = new URL(fileUrl);
    const hostname = url.hostname;

    // Add your allowed storage domains here
    const ALLOWED_DOMAINS = [
      "utfs.io", // Uploadthing
      "uploadthing.com",
      // Add S3, Cloudflare R2, etc. as needed
    ];

    // Allow localhost for development
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return { valid: true };
    }

    const isAllowed = ALLOWED_DOMAINS.some((domain) => hostname.includes(domain));

    if (!isAllowed) {
      return {
        valid: false,
        error: `File URL must be from an allowed storage provider. Hostname: ${hostname}`,
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `Invalid file URL format: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Validates AI analysis response against schema
 */
export function validateAiAnalysis(
  analysis: unknown,
  schema: z.ZodSchema
): { valid: boolean; data?: any; error?: string } {
  try {
    const result = schema.safeParse(analysis);
    if (!result.success) {
      return {
        valid: false,
        error: `AI returned invalid data: ${result.error.message}`,
      };
    }
    return { valid: true, data: result.data };
  } catch (error) {
    return {
      valid: false,
      error: `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

