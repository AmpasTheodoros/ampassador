"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Mail, Phone, X, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { QuickBill } from "./quick-bill";
import { cn } from "@/lib/utils";
import { getTranslations } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";

interface LeadItemProps {
  lead: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    description: string | null;
    priorityScore: number | null;
    aiSummary: string | null;
    source: string | null;
    createdAt: Date;
  };
  locale: Locale;
}

// Helper function to get badge variant based on priority score
function getPriorityVariant(score: number | null) {
  if (!score) return "secondary";
  if (score >= 9) return "destructive"; // Critical
  if (score >= 7) return "warning"; // High
  if (score >= 5) return "default"; // Medium
  return "secondary"; // Low
}

// Helper function to format time ago
function getTimeAgo(date: Date, t: (key: string) => string) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return t("dashboard.leads.timeAgo.now");
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return t("dashboard.leads.timeAgo.minutesAgo").replace("{minutes}", minutes.toString());
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return t("dashboard.leads.timeAgo.hoursAgo").replace("{hours}", hours.toString());
  }
  const days = Math.floor(diffInSeconds / 86400);
  return t("dashboard.leads.timeAgo.daysAgo").replace("{days}", days.toString());
}

export function LeadItem({ lead, locale }: LeadItemProps) {
  const t = getTranslations(locale);
  const [isIgnoring, setIsIgnoring] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const handleIgnore = async () => {
    setIsIgnoring(true);
    try {
      // TODO: Implement ignore action
      // await fetch(`/api/leads/${lead.id}`, { method: "PATCH", body: JSON.stringify({ status: "LOST" }) });
      console.log("Ignoring lead:", lead.id);
    } catch (error) {
      console.error("Error ignoring lead:", error);
    } finally {
      setIsIgnoring(false);
    }
  };

  const handleConvert = async () => {
    setIsConverting(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}/convert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to convert lead");
      }

      // Success - show feedback and redirect
      if (data.matter) {
        // Redirect to the new matter page
        const locale = window.location.pathname.split('/')[1] || 'el';
        window.location.href = `/${locale}/dashboard/matters/${data.matter.id}`;
      } else {
        // Just reload to show updated status
        window.location.reload();
      }
    } catch (error) {
      console.error("Error converting lead:", error);
      // Show user-friendly error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : t("dashboard.leads.convertError");
      alert(errorMessage);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border-b last:border-0 hover:bg-muted/50 transition-colors rounded-lg gap-3 sm:gap-0">
      <div className="flex gap-3 sm:gap-4 items-start sm:items-center flex-1 min-w-0 w-full sm:w-auto">
        {/* Priority Indicator */}
        <div
          className={cn(
            "w-2 h-2 rounded-full flex-shrink-0 mt-1.5 sm:mt-0",
            lead.priorityScore && lead.priorityScore > 7
              ? "bg-destructive"
              : lead.priorityScore && lead.priorityScore > 5
              ? "bg-accent"
              : "bg-primary"
          )}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="font-semibold truncate text-sm sm:text-base">{lead.name}</p>
            {lead.priorityScore && (
              <Badge
                variant={getPriorityVariant(lead.priorityScore)}
                className="text-xs flex-shrink-0"
              >
                {lead.priorityScore}/10
              </Badge>
            )}
          </div>
          
          {lead.aiSummary && (
            <p className="text-xs text-muted-foreground line-clamp-2 sm:line-clamp-1 mb-2">
              {lead.aiSummary}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
            {lead.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-[150px]">{lead.email}</span>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{lead.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span>{getTimeAgo(lead.createdAt, t)}</span>
            </div>
            {lead.source && (
              <Badge variant="outline" className="text-xs">
                {lead.source}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap sm:flex-nowrap gap-2 flex-shrink-0 w-full sm:w-auto sm:ml-4 items-stretch sm:items-center">
        <QuickBill 
          lead={{
            id: lead.id,
            name: lead.name,
            email: lead.email,
            aiSummary: lead.aiSummary,
            description: lead.description,
          }}
          locale={locale}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleIgnore}
          disabled={isIgnoring || isConverting}
          className="flex-1 sm:flex-initial"
        >
          <X className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">{t("dashboard.leads.actions.skip")}</span>
        </Button>
        <Button
          size="sm"
          onClick={handleConvert}
          disabled={isIgnoring || isConverting}
          className="flex-1 sm:flex-initial"
        >
          <CheckCircle2 className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">{t("dashboard.leads.actions.convertToMatter")}</span>
          <span className="sm:hidden">{locale === "el" ? "Μετατροπή" : "Convert"}</span>
        </Button>
      </div>
    </div>
  );
}

