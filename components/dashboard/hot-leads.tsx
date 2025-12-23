import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/auth";
import { TrendingUp } from "lucide-react";
import { LeadItem } from "./lead-item";
import { getTranslations } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";

/**
 * HotLeadsList Component
 * 
 * Server Component that displays the highest priority leads
 * Sorted by AI-generated priority score (highest first)
 */
export async function HotLeadsList({ locale }: { locale: Locale }) {
  const clerkOrgId = await requireOrgId();
  const t = getTranslations(locale);

  // Fetch top 5 highest priority leads
  const leads = await prisma.lead.findMany({
    where: {
      clerkOrgId,
      status: "NEW", // Only show new leads
    },
    orderBy: [
      { priorityScore: "desc" }, // Highest priority first
      { createdAt: "desc" }, // Most recent first if same priority
    ],
    take: 5,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      description: true,
      priorityScore: true,
      aiSummary: true,
      source: true,
      createdAt: true,
    },
  });

  if (leads.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
        <p className="text-sm text-muted-foreground">
          {t("dashboard.hotLeads.noLeads")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {leads.map((lead) => (
        <LeadItem key={lead.id} lead={lead} locale={locale} />
      ))}
    </div>
  );
}

