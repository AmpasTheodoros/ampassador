import { prisma } from "@/lib/prisma";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Lead Intake API
 * 
 * Public endpoint (or API key protected) for receiving leads from forms/landing pages
 * - Accepts lead submission with description
 * - Uses AI to analyze and score the lead (priority 1-10)
 * - Generates AI summary
 * - Stores in database
 * 
 * POST /api/leads/intake
 * 
 * Body:
 * {
 *   clerkOrgId: string (required)
 *   name: string (required)
 *   email: string (required)
 *   phone?: string
 *   description: string (required) - The legal issue/problem description
 *   source?: string - e.g. "Website Form", "Facebook Ads", "Referral"
 * }
 */
const leadIntakeSchema = z.object({
  clerkOrgId: z.string().min(1, "clerkOrgId is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  source: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validation = leadIntakeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { clerkOrgId, name, email, phone, description, source } = validation.data;

    // Verify firm exists
    const firm = await prisma.firm.findUnique({
      where: { clerkOrgId },
      select: { id: true, name: true },
    });

    if (!firm) {
      return NextResponse.json(
        { error: "Firm not found. Invalid clerkOrgId." },
        { status: 404 }
      );
    }

    // AI Analysis: Score the lead based on urgency and complexity
    let priorityScore: number | null = null;
    let aiSummary: string | null = null;

    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: `You are a legal assistant analyzing a client inquiry. Analyze the following legal request and provide a priority score and summary.

Legal Request: "${description}"

Provide a JSON response with:
1. "score": A number from 1 to 10 where:
   - 1-3: Low priority (routine matters, non-urgent)
   - 4-6: Medium priority (standard legal issues)
   - 7-8: High priority (urgent matters, complex cases)
   - 9-10: Critical priority (very urgent, high-value, or complex cases)

2. "summary": A concise 10-15 word summary in Greek of the legal issue

Respond ONLY with valid JSON in this format:
{"score": number, "summary": "string"}`,
        temperature: 0.3, // Lower temperature for more consistent scoring
      });

      // Parse AI response
      const aiResponse = JSON.parse(text.trim());
      priorityScore = Math.max(1, Math.min(10, parseInt(aiResponse.score) || 5)); // Clamp between 1-10
      aiSummary = aiResponse.summary || null;
    } catch (aiError) {
      console.error("AI Analysis Error:", aiError);
      // Continue without AI analysis if it fails
      priorityScore = 5; // Default medium priority
      aiSummary = "AI analysis unavailable";
    }

    // Create lead in database
    const newLead = await prisma.lead.create({
      data: {
        clerkOrgId,
        name,
        email,
        phone: phone || null,
        description,
        source: source || "Website Form",
        priorityScore,
        aiSummary,
        status: "NEW",
      },
    });

    // TODO: Send notification (SMS via Twilio, email, or push notification)
    // TODO: Trigger webhook if configured

    return NextResponse.json(
      {
        success: true,
        lead: {
          id: newLead.id,
          name: newLead.name,
          email: newLead.email,
          priorityScore: newLead.priorityScore,
          aiSummary: newLead.aiSummary,
          status: newLead.status,
        },
        message: "Lead created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lead Intake Error:", error);

    // Handle specific error types
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
        error: "Failed to process lead intake",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leads/intake
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Lead Intake API is active",
    endpoint: "POST /api/leads/intake",
  });
}

