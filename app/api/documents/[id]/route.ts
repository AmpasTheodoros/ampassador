import { requireOrgId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * Document by ID API
 * 
 * GET /api/documents/[id] - Get a specific document by ID
 * DELETE /api/documents/[id] - Delete a document (and its associated deadlines)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clerkOrgId = await requireOrgId();
    const { id } = await params;

    const document = await prisma.document.findFirst({
      where: {
        id,
        clerkOrgId, // Ensure document belongs to the organization
      },
      include: {
        matter: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
          },
        },
        deadlines: {
          orderBy: {
            dueDate: "asc",
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Document GET Error:", error);

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
        error: "Failed to fetch document",
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

    // Verify document exists and belongs to organization
    const document = await prisma.document.findFirst({
      where: {
        id,
        clerkOrgId,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Delete document (deadlines will be cascade deleted via onDelete: SetNull)
    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Document DELETE Error:", error);

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
        error: "Failed to delete document",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

