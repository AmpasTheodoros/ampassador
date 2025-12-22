import { requireOrgId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * Deadlines API
 * 
 * GET /api/deadlines - Get all deadlines for the authenticated organization
 * 
 * Query params:
 * - matterId: Filter by matter ID
 * - documentId: Filter by document ID
 * - status: Filter by status (PENDING, COMPLETED, OVERDUE, CANCELLED)
 * - upcoming: Boolean - if true, only return deadlines in the future
 * - limit: Number of deadlines to return (default: 50, max: 100)
 * - orderBy: Sort by (dueDate, createdAt) - default: dueDate
 * - order: asc | desc - default: asc
 */
export async function GET(req: NextRequest) {
  try {
    const clerkOrgId = await requireOrgId();

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const matterId = searchParams.get("matterId");
    const documentId = searchParams.get("documentId");
    const status = searchParams.get("status") as
      | "PENDING"
      | "COMPLETED"
      | "OVERDUE"
      | "CANCELLED"
      | null;
    const upcoming = searchParams.get("upcoming") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    const orderBy = searchParams.get("orderBy") || "dueDate";
    const order = searchParams.get("order") || "asc";

    // Build where clause
    const where: any = { clerkOrgId };
    if (matterId) {
      where.matterId = matterId;
    }
    if (documentId) {
      where.documentId = documentId;
    }
    if (status) {
      where.status = status;
    }
    if (upcoming) {
      where.dueDate = {
        gte: new Date(), // Greater than or equal to now
      };
      // Also filter out completed and cancelled
      where.status = { notIn: ["COMPLETED", "CANCELLED"] };
    }

    // Build orderBy clause
    const orderByClause: any = {};
    if (orderBy === "dueDate") {
      orderByClause.dueDate = order;
    } else if (orderBy === "createdAt") {
      orderByClause.createdAt = order;
    } else {
      orderByClause.dueDate = "asc"; // Default
    }

    // Fetch deadlines
    const deadlines = await prisma.deadline.findMany({
      where,
      take: Math.min(limit, 100), // Max 100 deadlines per request
      orderBy: orderByClause,
      include: {
        matter: {
          select: {
            id: true,
            title: true,
          },
        },
        document: {
          select: {
            id: true,
            fileName: true,
          },
        },
      },
    });

    // Get counts by status
    const [pendingCount, overdueCount, completedCount, totalCount] =
      await Promise.all([
        prisma.deadline.count({
          where: { clerkOrgId, status: "PENDING" },
        }),
        prisma.deadline.count({
          where: {
            clerkOrgId,
            status: "OVERDUE",
          },
        }),
        prisma.deadline.count({
          where: { clerkOrgId, status: "COMPLETED" },
        }),
        prisma.deadline.count({
          where: { clerkOrgId },
        }),
      ]);

    // Calculate upcoming deadlines (future dates, not completed/cancelled)
    const upcomingCount = await prisma.deadline.count({
      where: {
        clerkOrgId,
        dueDate: {
          gte: new Date(),
        },
        status: {
          notIn: ["COMPLETED", "CANCELLED"],
        },
      },
    });

    return NextResponse.json({
      deadlines,
      counts: {
        pending: pendingCount,
        overdue: overdueCount,
        completed: completedCount,
        upcoming: upcomingCount,
        total: totalCount,
      },
      filters: {
        matterId,
        documentId,
        status,
        upcoming,
        limit,
        orderBy,
        order,
      },
    });
  } catch (error) {
    console.error("Deadlines API Error:", error);

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
        error: "Failed to fetch deadlines",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

