import { requireOrgId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * Leads API
 * 
 * GET /api/leads - Get all leads for the authenticated organization
 * 
 * Query params:
 * - status: Filter by status (NEW, CONTACTED, CONVERTED, LOST)
 * - limit: Number of leads to return (default: 50)
 * - orderBy: Sort by (priorityScore, createdAt) - default: priorityScore
 * - order: asc | desc - default: desc
 */
export async function GET(req: NextRequest) {
  try {
    const clerkOrgId = await requireOrgId();

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status") as
      | "NEW"
      | "CONTACTED"
      | "CONVERTED"
      | "LOST"
      | null;
    const limit = parseInt(searchParams.get("limit") || "50");
    const orderBy = searchParams.get("orderBy") || "priorityScore";
    const order = searchParams.get("order") || "desc";

    // Build where clause
    const where: any = { clerkOrgId };
    if (status) {
      where.status = status;
    }

    // Build orderBy clause
    const orderByClause: any = {};
    if (orderBy === "priorityScore") {
      orderByClause.priorityScore = order;
    } else if (orderBy === "createdAt") {
      orderByClause.createdAt = order;
    } else {
      orderByClause.priorityScore = "desc"; // Default
    }

    // Fetch leads
    const leads = await prisma.lead.findMany({
      where,
      take: Math.min(limit, 100), // Max 100 leads per request
      orderBy: orderByClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        description: true,
        status: true,
        priorityScore: true,
        aiSummary: true,
        source: true,
        value: true,
        createdAt: true,
        updatedAt: true,
        convertedToMatterId: true,
      },
    });

    // Get counts by status
    const [newCount, contactedCount, convertedCount, totalCount] =
      await Promise.all([
        prisma.lead.count({
          where: { clerkOrgId, status: "NEW" },
        }),
        prisma.lead.count({
          where: { clerkOrgId, status: "CONTACTED" },
        }),
        prisma.lead.count({
          where: { clerkOrgId, status: "CONVERTED" },
        }),
        prisma.lead.count({
          where: { clerkOrgId },
        }),
      ]);

    return NextResponse.json({
      leads,
      counts: {
        new: newCount,
        contacted: contactedCount,
        converted: convertedCount,
        total: totalCount,
      },
      filters: {
        status,
        limit,
        orderBy,
        order,
      },
    });
  } catch (error) {
    console.error("Leads API Error:", error);

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
        error: "Failed to fetch leads",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

