import { TrendingUp } from "lucide-react";
import { LeadItem } from "./lead-item";
import { getTranslations } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";
import { Prisma } from "@prisma/client";

type Lead = Prisma.LeadGetPayload<{
  select: {
    id: true;
    name: true;
    email: true;
    phone: true;
    description: true;
    priorityScore: true;
    aiSummary: true;
    source: true;
    createdAt: true;
  };
}>;

/**
 * HotLeadsList Component
 * 
 * Displays the highest priority leads
 * Sorted by AI-generated priority score (highest first)
 * 
 * @param locale - The locale for translations
 * @param leads - Pre-fetched leads data (optional, for optimization)
 */
export function HotLeadsList({ 
  locale, 
  leads = [] 
}: { 
  locale: Locale;
  leads?: Lead[];
}) {
  const t = getTranslations(locale);

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

