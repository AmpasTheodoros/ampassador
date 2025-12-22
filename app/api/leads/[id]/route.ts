import { requireOrgId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Lead API (Single Lead Operations)
 * 
 * GET /api/leads/[id] - Get a specific lead
 * PATCH /api/leads/[id] - Update lead status or other fields
 * DELETE /api/leads/[id] - Delete a lead (soft delete by setting status to LOST)
 */

const updateLeadSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "CONVERTED", "LOST"]).optional(),
  notes: z.string().optional(),
  value: z.number().optional(),
  convertedToMatterId: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clerkOrgId = await requireOrgId();
    const { id } = await params;

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        clerkOrgId, // Ensure lead belongs to the organization
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

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Get Lead Error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized", message: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch lead",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clerkOrgId = await requireOrgId();
    const { id } = await params;
    const body = await req.json();

    // Validate input
    const validation = updateLeadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    // Verify lead exists and belongs to organization
    const existingLead = await prisma.lead.findFirst({
      where: {
        id,
        clerkOrgId,
      },
    });

    if (!existingLead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (validation.data.status) {
      updateData.status = validation.data.status;
    }
    if (validation.data.notes !== undefined) {
      updateData.notes = validation.data.notes;
    }
    if (validation.data.value !== undefined) {
      updateData.value = validation.data.value;
    }
    if (validation.data.convertedToMatterId) {
      // Verify matter belongs to same organization
      const matter = await prisma.matter.findFirst({
        where: {
          id: validation.data.convertedToMatterId,
          clerkOrgId,
        },
      });

      if (!matter) {
        return NextResponse.json(
          { error: "Matter not found or doesn't belong to your organization" },
          { status: 404 }
        );
      }

      updateData.convertedToMatterId = validation.data.convertedToMatterId;
      // Auto-update status to CONVERTED when linking to matter
      if (!validation.data.status) {
        updateData.status = "CONVERTED";
      }
    }

    // Update lead
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        convertedToMatter: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Update Lead Error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized", message: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to update lead",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clerkOrgId = await requireOrgId();
    const { id } = await params;

    // Verify lead exists and belongs to organization
    const existingLead = await prisma.lead.findFirst({
      where: {
        id,
        clerkOrgId,
      },
    });

    if (!existingLead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Soft delete: Set status to LOST
    const deletedLead = await prisma.lead.update({
      where: { id },
      data: { status: "LOST" },
    });

    return NextResponse.json({
      success: true,
      message: "Lead marked as lost",
      lead: deletedLead,
    });
  } catch (error) {
    console.error("Delete Lead Error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized", message: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to delete lead",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

