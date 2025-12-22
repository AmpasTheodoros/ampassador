import { requireOrgId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * Documents API
 * 
 * GET /api/documents - Get all documents for the authenticated organization
 * 
 * Query params:
 * - matterId: Filter by matter ID
 * - limit: Number of documents to return (default: 50, max: 100)
 * - orderBy: Sort by (createdAt, fileName) - default: createdAt
 * - order: asc | desc - default: desc
 */
export async function GET(req: NextRequest) {
  try {
    const clerkOrgId = await requireOrgId();

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const matterId = searchParams.get("matterId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const orderBy = searchParams.get("orderBy") || "createdAt";
    const order = searchParams.get("order") || "desc";

    // Build where clause
    const where: any = { clerkOrgId };
    if (matterId) {
      where.matterId = matterId;
    }

    // Build orderBy clause
    const orderByClause: any = {};
    if (orderBy === "createdAt") {
      orderByClause.createdAt = order;
    } else if (orderBy === "fileName") {
      orderByClause.fileName = order;
    } else {
      orderByClause.createdAt = "desc"; // Default
    }

    // Fetch documents
    const documents = await prisma.document.findMany({
      where,
      take: Math.min(limit, 100), // Max 100 documents per request
      orderBy: orderByClause,
      include: {
        matter: {
          select: {
            id: true,
            title: true,
          },
        },
        deadlines: {
          select: {
            id: true,
            title: true,
            dueDate: true,
            status: true,
          },
          orderBy: {
            dueDate: "asc",
          },
        },
      },
    });

    // Get counts
    const [totalCount, withMatterCount, withoutMatterCount] = await Promise.all([
      prisma.document.count({
        where: { clerkOrgId },
      }),
      prisma.document.count({
        where: { clerkOrgId, matterId: { not: null } },
      }),
      prisma.document.count({
        where: { clerkOrgId, matterId: null },
      }),
    ]);

    return NextResponse.json({
      documents,
      counts: {
        total: totalCount,
        withMatter: withMatterCount,
        withoutMatter: withoutMatterCount,
      },
      filters: {
        matterId,
        limit,
        orderBy,
        order,
      },
    });
  } catch (error) {
    console.error("Documents API Error:", error);

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
        error: "Failed to fetch documents",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

