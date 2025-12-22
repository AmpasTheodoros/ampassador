import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/auth";
import { AlertTriangle, FileText, Clock, Sparkles } from "lucide-react";
import { Prisma } from "@prisma/client";
import { cn } from "@/lib/utils";
// Helper function to format time until deadline
function formatTimeUntil(date: Date): string {
  const now = new Date();
  const diffInMs = date.getTime() - now.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) {
    const minutes = Math.floor(diffInMs / (1000 * 60));
    return `σε ${minutes} λεπτά`;
  } else if (diffInHours < 24) {
    return `σε ${diffInHours} ώρες`;
  } else if (diffInDays === 1) {
    return "αύριο";
  } else {
    return `σε ${diffInDays} ημέρες`;
  }
}

/**
 * AI Insights Component
 * 
 * Displays:
 * - Upcoming deadlines (urgent, within 48h)
 * - Recent document analyses
 * - AI-generated recommendations
 */
export async function AIInsights() {
  const clerkOrgId = await requireOrgId();

  // Fetch upcoming deadlines (next 7 days, not completed)
  const upcomingDeadlines = await prisma.deadline.findMany({
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
    take: 5,
    include: {
      matter: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  // Fetch recently analyzed documents (last 5)
  const recentDocuments = await prisma.document.findMany({
    where: {
      clerkOrgId,
      aiAnalysis: {
        not: Prisma.JsonNull,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 3,
    include: {
      matter: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  // Calculate urgent deadlines (within 48 hours)
  const now = new Date();
  const urgentDeadlines = upcomingDeadlines.filter((deadline: typeof upcomingDeadlines[0]) => {
    const hoursUntilDeadline =
      (deadline.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilDeadline <= 48;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Legal Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Urgent Deadlines */}
        {urgentDeadlines.length > 0 && (
          <div className="space-y-2">
            {urgentDeadlines.map((deadline: typeof urgentDeadlines[0]) => {
              const hoursUntilDeadline =
                (deadline.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
              const isUrgent = hoursUntilDeadline <= 48;
              
              return (
                <div
                  key={deadline.id}
                  className={cn(
                    "p-3 border-l-4 rounded transition-colors",
                    isUrgent
                      ? "bg-destructive/10 border-destructive"
                      : "bg-accent/10 border-accent"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {isUrgent && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                        <p
                          className={cn(
                            "text-sm font-medium",
                            isUrgent
                              ? "text-destructive"
                              : "text-accent"
                          )}
                        >
                          {isUrgent
                            ? `Προσοχή: Προθεσμία σε ${Math.round(hoursUntilDeadline)}h`
                            : `Προθεσμία ${formatTimeUntil(deadline.dueDate)}`}
                        </p>
                      </div>
                      <p
                        className={cn(
                          "text-xs",
                          isUrgent
                            ? "text-destructive/80"
                            : "text-accent/80"
                        )}
                      >
                        {deadline.matter?.title || "Δεν συνδέεται με υπόθεση"}
                      </p>
                      <p
                        className={cn(
                          "text-xs mt-1",
                          isUrgent
                            ? "text-destructive/70"
                            : "text-accent/70"
                        )}
                      >
                        {deadline.title}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recent Document Analyses */}
        {recentDocuments.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Νέα Έγγραφα
            </p>
            {recentDocuments.map((doc: typeof recentDocuments[0]) => {
              const analysis = doc.aiAnalysis as any;
              const summary =
                analysis?.summary || "Έγγραφο αναλύθηκε επιτυχώς";

              return (
                <div
                  key={doc.id}
                  className="p-3 bg-accent/10 border-l-4 border-accent rounded"
                >
                  <div className="flex items-start gap-2 mb-1">
                    <FileText className="h-4 w-4 text-accent mt-0.5" />
                    <p className="text-sm font-medium text-accent">
                      Νέο Έγγραφο Αναλύθηκε
                    </p>
                  </div>
                  <p className="text-xs text-accent/80 mb-1">
                    {doc.fileName}
                  </p>
                  {doc.matter && (
                    <p className="text-xs text-accent/70 mb-1">
                      Υπόθεση: {doc.matter.title}
                    </p>
                  )}
                  <p className="text-xs text-accent/70 line-clamp-2">
                    {summary}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {urgentDeadlines.length === 0 && recentDocuments.length === 0 && (
          <div className="text-center py-8">
            <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Δεν υπάρχουν νέα insights αυτή τη στιγμή
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

