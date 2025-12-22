"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Mail, Phone, X, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { QuickBill } from "./quick-bill";

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
function getTimeAgo(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Τώρα";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}λ πριν`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}ω πριν`;
  return `${Math.floor(diffInSeconds / 86400)}μ πριν`;
}

export function LeadItem({ lead }: LeadItemProps) {
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
        : "Αποτυχία μετατροπής του lead σε υπόθεση. Παρακαλώ δοκιμάστε ξανά.";
      alert(errorMessage);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/50 transition-colors rounded-lg">
      <div className="flex gap-4 items-center flex-1 min-w-0">
        {/* Priority Indicator */}
        <div
          className={`
            w-2 h-2 rounded-full flex-shrink-0
            ${
              lead.priorityScore && lead.priorityScore > 7
                ? "bg-red-500"
                : lead.priorityScore && lead.priorityScore > 5
                ? "bg-yellow-500"
                : "bg-green-500"
            }
          `}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold truncate">{lead.name}</p>
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
            <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
              {lead.aiSummary}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {lead.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{lead.email}</span>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>{lead.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{getTimeAgo(lead.createdAt)}</span>
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
      <div className="flex gap-2 flex-shrink-0 ml-4 items-center">
        <QuickBill 
          lead={{
            id: lead.id,
            name: lead.name,
            email: lead.email,
            aiSummary: lead.aiSummary,
            description: lead.description,
          }}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleIgnore}
          disabled={isIgnoring || isConverting}
        >
          <X className="h-4 w-4 mr-1" />
          Παράβλεψη
        </Button>
        <Button
          size="sm"
          onClick={handleConvert}
          disabled={isIgnoring || isConverting}
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Μετατροπή σε Υπόθεση
        </Button>
      </div>
    </div>
  );
}

