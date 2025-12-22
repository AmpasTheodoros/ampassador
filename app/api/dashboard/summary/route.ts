import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Dashboard Summary API
 * Returns aggregated data for the 360 Dashboard
 * 
 * Protected route - requires Clerk authentication and organization membership
 */
export async function GET() {
  try {
    // Get authenticated organization ID from Clerk
    const clerkOrgId = await requireOrgId();

    // Parallel queries for better performance
    const [
      newLeadsCount,
      contactedLeadsCount,
      convertedLeadsCount,
      activeMattersCount,
      closedMattersCount,
      unpaidInvoicesData,
      overdueInvoicesData,
      totalRevenueData,
    ] = await Promise.all([
      // Leads stats
      prisma.lead.count({
        where: { clerkOrgId, status: "NEW" },
      }),
      prisma.lead.count({
        where: { clerkOrgId, status: "CONTACTED" },
      }),
      prisma.lead.count({
        where: { clerkOrgId, status: "CONVERTED" },
      }),
      // Matters stats
      prisma.matter.count({
        where: { clerkOrgId, status: "ACTIVE" },
      }),
      prisma.matter.count({
        where: { clerkOrgId, status: "CLOSED" },
      }),
      // Invoice stats - unpaid
      prisma.invoice.aggregate({
        where: {
          clerkOrgId,
          status: "UNPAID",
        },
        _sum: {
          amount: true,
        },
        _count: true,
      }),
      // Invoice stats - overdue
      prisma.invoice.aggregate({
        where: {
          clerkOrgId,
          status: "UNPAID",
          dueDate: {
            lt: new Date(), // Past due date
          },
        },
        _sum: {
          amount: true,
        },
        _count: true,
      }),
      // Total revenue (paid invoices)
      prisma.invoice.aggregate({
        where: {
          clerkOrgId,
          status: "PAID",
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    // Calculate conversion rate
    const totalLeads = newLeadsCount + contactedLeadsCount + convertedLeadsCount;
    const conversionRate =
      totalLeads > 0 ? (convertedLeadsCount / totalLeads) * 100 : 0;

    return NextResponse.json({
      leads: {
        new: newLeadsCount,
        contacted: contactedLeadsCount,
        converted: convertedLeadsCount,
        total: totalLeads,
        conversionRate: Math.round(conversionRate * 100) / 100, // Round to 2 decimals
      },
      matters: {
        active: activeMattersCount,
        closed: closedMattersCount,
        total: activeMattersCount + closedMattersCount,
      },
      invoices: {
        unpaid: {
          count: unpaidInvoicesData._count,
          amount: unpaidInvoicesData._sum.amount || 0,
        },
        overdue: {
          count: overdueInvoicesData._count,
          amount: overdueInvoicesData._sum.amount || 0,
        },
        totalRevenue: totalRevenueData._sum.amount || 0,
      },
      // AI insights placeholder - can be extended later
      insights: {
        // TODO: Add AI-generated insights here
        recommendations: [],
      },
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    
    // Handle auth errors specifically
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
        error: "Failed to fetch dashboard summary",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

