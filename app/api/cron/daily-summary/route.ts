import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { Prisma } from "@prisma/client";

/**
 * Daily AI Summary Cron Job
 * 
 * Runs daily at 08:00 UTC (via Vercel Cron)
 * Sends email digest to each law firm with:
 * - New leads from last 24h
 * - Upcoming deadlines (next 7 days)
 * - Recent payments
 * - AI insights
 * 
 * Protected by CRON_SECRET environment variable
 */
export async function GET(req: NextRequest) {
  try {
    // Protect the route - only Vercel Cron can call it
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET is not set");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get base URL for email links
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ampassador.com";
    const locale = "el"; // Default to Greek, can be made dynamic per firm

    // Get all firms with their users
    const firms = await prisma.firm.findMany({
      include: {
        users: {
          where: {
            role: "ATTORNEY", // Send to attorneys
          },
          take: 1, // Send to first attorney (can be extended to send to all)
        },
      },
    });

    const results = [];

    for (const firm of firms) {
      // Skip if no users
      if (firm.users.length === 0) {
        continue;
      }

      const recipientEmail = firm.users[0].email;
      const clerkOrgId = firm.clerkOrgId;

      // Calculate date range (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Fetch data in parallel
      const [
        newLeads,
        upcomingDeadlines,
        recentPayments,
        urgentDeadlines,
      ] = await Promise.all([
        // New leads from last 24h
        prisma.lead.findMany({
          where: {
            clerkOrgId,
            createdAt: {
              gte: yesterday,
            },
            status: {
              in: ["NEW", "CONTACTED"],
            },
          },
          orderBy: {
            priorityScore: "desc", // Highest priority first
          },
          take: 10,
          select: {
            id: true,
            name: true,
            email: true,
            aiSummary: true,
            priorityScore: true,
            description: true,
            createdAt: true,
          },
        }),

        // Upcoming deadlines (next 7 days)
        prisma.deadline.findMany({
          where: {
            clerkOrgId,
            status: {
              notIn: ["COMPLETED", "CANCELLED"],
            },
            dueDate: {
              gte: new Date(),
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
            },
          },
          orderBy: {
            dueDate: "asc",
          },
          take: 10,
          include: {
            matter: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        }),

        // Recent payments (last 7 days)
        prisma.invoice.findMany({
          where: {
            clerkOrgId,
            status: "PAID",
            paidAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
          orderBy: {
            paidAt: "desc",
          },
          take: 5,
          select: {
            id: true,
            amount: true,
            description: true,
            paidAt: true,
          },
        }),

        // Urgent deadlines (within 48 hours)
        prisma.deadline.findMany({
          where: {
            clerkOrgId,
            status: {
              notIn: ["COMPLETED", "CANCELLED"],
            },
            dueDate: {
              gte: new Date(),
              lte: new Date(Date.now() + 48 * 60 * 60 * 1000), // Next 48 hours
            },
          },
          orderBy: {
            dueDate: "asc",
          },
          take: 5,
          include: {
            matter: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        }),
      ]);

      // Calculate stats
      const totalNewLeads = newLeads.length;
      const hotLeads = newLeads.filter((lead) => (lead.priorityScore || 0) >= 7).length;
      const totalUpcomingDeadlines = upcomingDeadlines.length;
      const totalUrgentDeadlines = urgentDeadlines.length;
      const totalRecentPayments = recentPayments.length;
      const totalRevenue = recentPayments.reduce((sum, inv) => sum + inv.amount, 0);

      // Only send email if there's something to report
      if (
        totalNewLeads > 0 ||
        totalUpcomingDeadlines > 0 ||
        totalRecentPayments > 0 ||
        totalUrgentDeadlines > 0
      ) {
        const emailHtml = generateEmailTemplate({
          firmName: firm.name,
          newLeads,
          hotLeads,
          upcomingDeadlines,
          urgentDeadlines,
          recentPayments,
          totalRevenue,
          baseUrl,
          locale,
        });

        const emailResult = await sendEmail({
          to: recipientEmail,
          subject: `📊 Daily AI Summary: ${totalNewLeads} Νέα Leads, ${totalUrgentDeadlines} Επείγουσες Προθεσμίες`,
          html: emailHtml,
        });

        results.push({
          firmId: firm.id,
          firmName: firm.name,
          email: recipientEmail,
          success: emailResult.success,
          error: emailResult.error,
        });

        console.log(
          `Daily summary sent to ${firm.name} (${recipientEmail}): ${emailResult.success ? "Success" : "Failed"}`
        );
      } else {
        results.push({
          firmId: firm.id,
          firmName: firm.name,
          email: recipientEmail,
          skipped: true,
          reason: "No new activity",
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      firmsProcessed: results.length,
      results,
    });
  } catch (error) {
    console.error("Daily Summary Cron Error:", error);
    return NextResponse.json(
      {
        error: "Failed to process daily summary",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Generate HTML email template
 */
function generateEmailTemplate({
  firmName,
  newLeads,
  hotLeads,
  upcomingDeadlines,
  urgentDeadlines,
  recentPayments,
  totalRevenue,
  baseUrl,
  locale,
}: {
  firmName: string;
  newLeads: Array<{
    id: string;
    name: string;
    email: string;
    aiSummary: string | null;
    priorityScore: number | null;
    description: string | null;
    createdAt: Date;
  }>;
  hotLeads: number;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    dueDate: Date;
    matter: { id: string; title: string } | null;
  }>;
  urgentDeadlines: Array<{
    id: string;
    title: string;
    dueDate: Date;
    matter: { id: string; title: string } | null;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    description: string | null;
    paidAt: Date | null;
  }>;
  totalRevenue: number;
  baseUrl: string;
  locale: string;
}): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("el-GR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("el-GR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatDateShort = (date: Date) => {
    return new Intl.DateTimeFormat("el-GR", {
      day: "numeric",
      month: "short",
    }).format(date);
  };

  const getPriorityBadge = (score: number | null) => {
    if (!score) return "";
    if (score >= 9) return '<span style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">ΚΡΙΣΙΜΟ</span>';
    if (score >= 7) return '<span style="background: #f59e0b; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">ΥΨΗΛΟ</span>';
    if (score >= 5) return '<span style="background: #3b82f6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">ΜΕΣΑΙΟ</span>';
    return '<span style="background: #6b7280; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">ΧΑΜΗΛΟ</span>';
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily AI Summary</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
      <h1 style="color: #1f2937; margin: 0; font-size: 28px;">🤖 Daily AI Summary</h1>
      <p style="color: #6b7280; margin: 8px 0 0 0; font-size: 14px;">${firmName}</p>
      <p style="color: #9ca3af; margin: 4px 0 0 0; font-size: 12px;">${formatDate(new Date())}</p>
    </div>

    <!-- Hot Leads Section -->
    ${newLeads.length > 0 ? `
    <div style="margin-bottom: 30px;">
      <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 15px 0; display: flex; align-items: center; gap: 8px;">
        🔥 Νέα Leads (${newLeads.length})
        ${hotLeads > 0 ? `<span style="background: #ef4444; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold;">${hotLeads} Hot!</span>` : ""}
      </h2>
      <div style="background: #f9fafb; border-radius: 6px; padding: 15px;">
        ${newLeads
          .map(
            (lead) => `
          <div style="padding: 12px; background: white; border-left: 3px solid ${(lead.priorityScore || 0) >= 7 ? "#ef4444" : (lead.priorityScore || 0) >= 5 ? "#f59e0b" : "#3b82f6"}; margin-bottom: 10px; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px;">
              <strong style="color: #1f2937; font-size: 15px;">${lead.name}</strong>
              ${getPriorityBadge(lead.priorityScore)}
            </div>
            ${lead.aiSummary ? `<p style="color: #4b5563; font-size: 13px; margin: 6px 0; line-height: 1.5;">${lead.aiSummary}</p>` : ""}
            <p style="color: #9ca3af; font-size: 11px; margin: 4px 0 0 0;">${formatDate(lead.createdAt)}</p>
          </div>
        `
          )
          .join("")}
      </div>
      <a href="${baseUrl}/dashboard/leads" style="display: inline-block; margin-top: 12px; color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 500;">→ Δείτε όλα τα Leads</a>
    </div>
    ` : ""}

    <!-- Urgent Deadlines Section -->
    ${urgentDeadlines.length > 0 ? `
    <div style="margin-bottom: 30px; background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 6px;">
      <h2 style="color: #991b1b; font-size: 18px; margin: 0 0 12px 0;">⚠️ Επείγουσες Προθεσμίες (${urgentDeadlines.length})</h2>
      ${urgentDeadlines
        .map(
          (deadline) => `
        <div style="padding: 10px; background: white; margin-bottom: 8px; border-radius: 4px;">
          <strong style="color: #1f2937; font-size: 14px;">${deadline.title}</strong>
          ${deadline.matter ? `<p style="color: #6b7280; font-size: 12px; margin: 4px 0;">Υπόθεση: ${deadline.matter.title}</p>` : ""}
          <p style="color: #ef4444; font-size: 12px; margin: 4px 0 0 0; font-weight: 600;">📅 ${formatDateShort(deadline.dueDate)}</p>
        </div>
      `
        )
        .join("")}
      <a href="${baseUrl}/dashboard" style="display: inline-block; margin-top: 10px; color: #dc2626; text-decoration: none; font-size: 13px; font-weight: 600;">→ Δείτε όλες τις Προθεσμίες</a>
    </div>
    ` : ""}

    <!-- Upcoming Deadlines Section -->
    ${upcomingDeadlines.length > 0 && urgentDeadlines.length === 0 ? `
    <div style="margin-bottom: 30px;">
      <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 12px 0;">📅 Προσεχείς Προθεσμίες (${upcomingDeadlines.length})</h2>
      ${upcomingDeadlines
        .slice(0, 5)
        .map(
          (deadline) => `
        <div style="padding: 10px; background: #f9fafb; margin-bottom: 8px; border-radius: 4px; border-left: 3px solid #3b82f6;">
          <strong style="color: #1f2937; font-size: 14px;">${deadline.title}</strong>
          ${deadline.matter ? `<p style="color: #6b7280; font-size: 12px; margin: 4px 0;">Υπόθεση: ${deadline.matter.title}</p>` : ""}
          <p style="color: #6b7280; font-size: 12px; margin: 4px 0 0 0;">📅 ${formatDateShort(deadline.dueDate)}</p>
        </div>
      `
        )
        .join("")}
    </div>
    ` : ""}

    <!-- Recent Payments Section -->
    ${recentPayments.length > 0 ? `
    <div style="margin-bottom: 30px; background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; border-radius: 6px;">
      <h2 style="color: #166534; font-size: 18px; margin: 0 0 12px 0;">💰 Πρόσφατες Πληρωμές (${recentPayments.length})</h2>
      <p style="color: #15803d; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">Σύνολο: ${formatCurrency(totalRevenue)}</p>
      ${recentPayments
        .map(
          (payment) => `
        <div style="padding: 10px; background: white; margin-bottom: 8px; border-radius: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: #1f2937; font-size: 14px;">${payment.description || "Πληρωμή"}</strong>
              ${payment.paidAt ? `<p style="color: #6b7280; font-size: 11px; margin: 4px 0 0 0;">${formatDateShort(payment.paidAt)}</p>` : ""}
            </div>
            <strong style="color: #15803d; font-size: 16px;">${formatCurrency(payment.amount)}</strong>
          </div>
        </div>
      `
        )
        .join("")}
    </div>
    ` : ""}

    <!-- Footer -->
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
      <a href="${baseUrl}/dashboard" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Ανοίξτε το Dashboard</a>
      <p style="color: #9ca3af; font-size: 12px; margin: 20px 0 0 0;">
        Αυτό το email αποστέλλεται αυτόματα κάθε πρωί στις 08:00.<br>
        <a href="${baseUrl}/dashboard/settings" style="color: #6b7280; text-decoration: none;">Ρυθμίσεις</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

