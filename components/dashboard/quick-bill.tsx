"use client";

import { Button } from "@/components/ui/button";
import { Euro, Loader2 } from "lucide-react";
import { useState } from "react";

interface QuickBillProps {
  lead: {
    id: string;
    name: string;
    email: string;
    aiSummary: string | null;
    description: string | null;
  };
  defaultAmount?: number;
}

/**
 * QuickBill Component
 * 
 * Creates a quick payment link for a lead.
 * Opens Stripe Checkout in a new window.
 */
export function QuickBill({ lead, defaultAmount = 150 }: QuickBillProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBill = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const description = lead.aiSummary 
        ? `Προκαταβολή για υπόθεση: ${lead.aiSummary}`
        : `Προκαταβολή για υπόθεση: ${lead.name}`;

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
        throw new Error(data.error || data.message || "Αποτυχία δημιουργίας checkout session");
      }

      // Open checkout URL in new window
      if (data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      } else {
        throw new Error("Δεν επιστράφηκε checkout URL");
      }
    } catch (error) {
      console.error("QuickBill Error:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Αποτυχία δημιουργίας checkout session. Παρακαλώ δοκιμάστε ξανά.";
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
            Δημιουργία...
          </>
        ) : (
          <>
            <Euro className="h-4 w-4 mr-1" />
            Άμεση Πληρωμή ({defaultAmount}€)
          </>
        )}
      </Button>
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}

