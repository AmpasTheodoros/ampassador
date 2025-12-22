import { prisma } from "@/lib/prisma";
import { subDays, format, startOfDay, endOfDay } from "date-fns";

/**
 * Get Dashboard Analytics Data
 * 
 * Aggregates leads and revenue data for the last N days
 * Returns data formatted for Recharts visualization
 */
export async function getDashboardAnalytics(
  orgId: string,
  days: number = 7
): Promise<
  Array<{
    date: string;
    dateLabel: string; // Formatted for display (dd/MM)
    leads: number;
    revenue: number;
    conversions: number; // Leads converted to matters
  }>
> {
  const startDate = subDays(new Date(), days);
  const endDate = new Date();

  // Generate date range array
  const dateRange = Array.from({ length: days }).map((_, i) => {
    const date = subDays(endDate, days - 1 - i);
    return {
      dateKey: format(date, "yyyy-MM-dd"),
      dateLabel: format(date, "dd/MM"),
      date: startOfDay(date),
    };
  });

  // Fetch data in parallel
  const [leads, invoices, convertedLeads] = await Promise.all([
    // All leads from the period
    prisma.lead.findMany({
      where: {
        clerkOrgId: orgId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        createdAt: true,
        status: true,
      },
    }),

    // Paid invoices from the period
    prisma.invoice.findMany({
      where: {
        clerkOrgId: orgId,
        status: "PAID",
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        amount: true,
        paidAt: true,
      },
    }),

    // Converted leads (for conversion tracking)
    prisma.lead.findMany({
      where: {
        clerkOrgId: orgId,
        status: "CONVERTED",
        updatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        updatedAt: true,
      },
    }),
  ]);

  // Group data by date
  return dateRange.map(({ dateKey, dateLabel, date }) => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    // Filter leads created on this day
    const dayLeads = leads.filter((lead) => {
      const leadDate = startOfDay(lead.createdAt);
      return leadDate >= dayStart && leadDate <= dayEnd;
    });

    // Filter invoices paid on this day
    const dayInvoices = invoices.filter((invoice) => {
      if (!invoice.paidAt) return false;
      const paidDate = startOfDay(invoice.paidAt);
      return paidDate >= dayStart && paidDate <= dayEnd;
    });

    // Filter conversions on this day
    const dayConversions = convertedLeads.filter((lead) => {
      const convertedDate = startOfDay(lead.updatedAt);
      return convertedDate >= dayStart && convertedDate <= dayEnd;
    });

    return {
      date: dateKey,
      dateLabel,
      leads: dayLeads.length,
      revenue: dayInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      conversions: dayConversions.length,
    };
  });
}

/**
 * Get Summary Statistics
 * 
 * Returns aggregated stats for the dashboard
 */
export async function getAnalyticsSummary(orgId: string) {
  const last30Days = subDays(new Date(), 30);
  const last7Days = subDays(new Date(), 7);

  const [
    totalRevenue,
    last7DaysRevenue,
    totalLeads,
    last7DaysLeads,
    totalConversions,
    last7DaysConversions,
    conversionRate,
  ] = await Promise.all([
    // Total revenue (all time)
    prisma.invoice.aggregate({
      where: {
        clerkOrgId: orgId,
        status: "PAID",
      },
      _sum: {
        amount: true,
      },
    }),

    // Revenue last 7 days
    prisma.invoice.aggregate({
      where: {
        clerkOrgId: orgId,
        status: "PAID",
        paidAt: {
          gte: last7Days,
        },
      },
      _sum: {
        amount: true,
      },
    }),

    // Total leads (all time)
    prisma.lead.count({
      where: {
        clerkOrgId: orgId,
      },
    }),

    // Leads last 7 days
    prisma.lead.count({
      where: {
        clerkOrgId: orgId,
        createdAt: {
          gte: last7Days,
        },
      },
    }),

    // Total conversions (all time)
    prisma.lead.count({
      where: {
        clerkOrgId: orgId,
        status: "CONVERTED",
      },
    }),

    // Conversions last 7 days
    prisma.lead.count({
      where: {
        clerkOrgId: orgId,
        status: "CONVERTED",
        updatedAt: {
          gte: last7Days,
        },
      },
    }),

    // Calculate conversion rate
    prisma.lead.count({
      where: {
        clerkOrgId: orgId,
        status: "CONVERTED",
      },
    }).then((converted) => {
      return prisma.lead.count({
        where: {
          clerkOrgId: orgId,
        },
      }).then((total) => {
        return total > 0 ? (converted / total) * 100 : 0;
      });
    }),
  ]);

  return {
    revenue: {
      total: totalRevenue._sum.amount || 0,
      last7Days: last7DaysRevenue._sum.amount || 0,
    },
    leads: {
      total: totalLeads,
      last7Days: last7DaysLeads,
    },
    conversions: {
      total: totalConversions,
      last7Days: last7DaysConversions,
    },
    conversionRate: await conversionRate,
  };
}

