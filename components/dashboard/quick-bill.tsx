"use client";

import { Button } from "@/components/ui/button";
import { Euro, Loader2 } from "lucide-react";
import { useState } from "react";
import { getTranslations } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";

interface QuickBillProps {
  lead: {
    id: string;
    name: string;
    email: string;
    aiSummary: string | null;
    description: string | null;
  };
  defaultAmount?: number;
  locale: Locale;
}

/**
 * QuickBill Component
 * 
 * Creates a quick payment link for a lead.
 * Opens Stripe Checkout in a new window.
 */
export function QuickBill({ lead, defaultAmount = 150, locale }: QuickBillProps) {
  const t = getTranslations(locale);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBill = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const description = lead.aiSummary 
        ? t("dashboard.leads.actions.advancePaymentForCase").replace("{summary}", lead.aiSummary)
        : t("dashboard.leads.actions.advancePaymentFor").replace("{name}", lead.name);

      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: defaultAmount,
          customerEmail: lead.email,
          description,
          leadId: lead.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || t("dashboard.leads.actions.checkoutSessionFailed"));
      }

      // Open checkout URL in new window
      if (data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      } else {
        throw new Error(t("dashboard.leads.actions.checkoutUrlNotReturned"));
      }
    } catch (error) {
      console.error("QuickBill Error:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : t("dashboard.leads.actions.checkoutSessionError");
      setError(errorMessage);
      
      // Show error to user (you can replace with toast notification)
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleBill}
        disabled={isLoading}
        className="text-accent border-accent hover:bg-accent/10 hover:text-accent"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            {t("dashboard.leads.actions.creating")}
          </>
        ) : (
          <>
            <Euro className="h-4 w-4 mr-1" />
            {t("dashboard.leads.actions.quickBillButton").replace("{amount}", defaultAmount.toString())}
          </>
        )}
      </Button>
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}

