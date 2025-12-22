import { requireOrgId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * Convert Lead to Matter API
 * 
 * POST /api/leads/[id]/convert
 * 
 * Creates a new Matter from a Lead and links them together
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clerkOrgId = await requireOrgId();
    const { id } = await params;

    // Fetch the lead
    const lead = await prisma.lead.findFirst({
      where: {
        id,
        clerkOrgId, // Ensure lead belongs to the organization
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Check if lead is already converted
    if (lead.status === "CONVERTED" && lead.convertedToMatterId) {
      return NextResponse.json(
        {
          error: "Lead is already converted to a matter",
          matterId: lead.convertedToMatterId,
        },
        { status: 400 }
      );
    }

    // Create a new Matter from the Lead
    const matter = await prisma.matter.create({
      data: {
        clerkOrgId,
        title: `${lead.name} - ${lead.aiSummary || lead.description?.substring(0, 50) || "New Matter"}`,
        description: lead.description || lead.aiSummary || null,
        status: "ACTIVE",
        billingType: "Fixed", // Default to Fixed, can be changed later
        // You can add more fields here if needed
      },
    });

    // Update the Lead to link it to the new Matter and mark as CONVERTED
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        status: "CONVERTED",
        convertedToMatterId: matter.id,
      },
      include: {
        convertedToMatter: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Lead converted to matter successfully",
      lead: updatedLead,
      matter: {
        id: matter.id,
        title: matter.title,
        status: matter.status,
      },
    });
  } catch (error) {
    console.error("Convert Lead Error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized", message: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to convert lead to matter",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

