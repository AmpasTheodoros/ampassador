"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface StripeConnectStatus {
  connected: boolean;
  onboarded: boolean;
  accountId?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
}

/**
 * StripeConnectButton Component
 * 
 * Handles Stripe Connect onboarding for law firms
 * - Shows current connection status
 * - Initiates onboarding flow
 * - Displays success/error states
 */
export function StripeConnectButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<StripeConnectStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check current status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setCheckingStatus(true);
      const res = await fetch("/api/stripe/connect");
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      console.error("Failed to check Stripe Connect status:", error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create Stripe Connect account");
      }

      // If already onboarded, just refresh status
      if (data.onboarded) {
        await checkStatus();
        return;
      }

      // Redirect to Stripe onboarding
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Stripe Connect error:", error);
      alert(error instanceof Error ? error.message : "Failed to setup payments");
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Checking status...
      </Button>
    );
  }

  // Already onboarded - show success state
  if (status?.onboarded) {
    return (
      <div className="flex flex-col gap-2">
        <Button variant="outline" disabled>
          ✓ Payments Enabled
        </Button>
        <p className="text-sm text-muted-foreground">
          Your Stripe account is connected and ready to receive payments.
        </p>
      </div>
    );
  }

  // Connected but not fully onboarded
  if (status?.connected && !status.onboarded) {
    return (
      <div className="flex flex-col gap-2">
        <Button onClick={handleConnect} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Complete Setup"
          )}
        </Button>
        <p className="text-sm text-muted-foreground">
          Please complete your payment setup to start accepting payments.
        </p>
      </div>
    );
  }

  // Not connected - show setup button
  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleConnect} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          "Setup Firm Payments"
        )}
      </Button>
      <p className="text-sm text-muted-foreground">
        Connect your Stripe account to accept payments from clients.
      </p>
    </div>
  );
}

