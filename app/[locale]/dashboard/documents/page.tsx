import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrgId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FileText, MessageSquare, Calendar, AlertCircle } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";
import { DocumentUpload } from "@/components/dashboard/document-upload";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getTranslations(locale as Locale);
  const clerkOrgId = await getOrgId();

  // If user is not in an organization, show setup message
  if (!clerkOrgId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-8">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <CardTitle className="text-2xl">
                {locale === "el"
                  ? "Απαιτείται Οργανισμός"
                  : "Organization Required"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {locale === "el"
                ? "Χρειάζεται να είστε μέλος ενός οργανισμού για να αποκτήσετε πρόσβαση στα έγγραφα."
                : "You need to be part of an organization to access documents."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch documents
  const documents = await prisma.document.findMany({
    where: { clerkOrgId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      matter: {
        select: {
          id: true,
          title: true,
        },
      },
      deadlines: {
        take: 1,
        orderBy: {
          dueDate: "asc",
        },
      },
    },
  });

  return (
    <div className="space-y-6 lg:space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {locale === "el" ? "Έγγραφα" : "Documents"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {locale === "el"
              ? "Διαχειριστείτε και αναλύστε τα νομικά σας έγγραφα"
              : "Manage and analyze your legal documents"}
          </p>
        </div>
      </div>

      {/* Upload Component */}
      <DocumentUpload locale={locale} />

      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "el" ? "Όλα τα Έγγραφα" : "All Documents"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                {locale === "el"
                  ? "Δεν βρέθηκαν έγγραφα"
                  : "No documents found"}
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {documents.map((doc) => {
                const analysis = doc.aiAnalysis as any;
                return (
                  <div
                    key={doc.id}
                    className="border rounded-lg p-3 sm:p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0 w-full sm:w-auto">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                          <h3 className="font-semibold text-base sm:text-lg truncate flex-1 min-w-0">
                            {doc.fileName}
                          </h3>
                          {analysis?.urgency && (
                            <span
                              className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                                analysis.urgency === "HIGH"
                                  ? "bg-destructive/10 text-destructive"
                                  : analysis.urgency === "MEDIUM"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : "bg-muted"
                              }`}
                            >
                              {analysis.urgency}
                            </span>
                          )}
                        </div>

                        {analysis?.summary && (
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">
                            {analysis.summary}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-muted-foreground">
                          {doc.matter && (
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="font-medium flex-shrink-0">
                                {locale === "el" ? "Υπόθεση:" : "Matter:"}
                              </span>
                              <Link
                                href={`/${locale}/dashboard/matters/${doc.matter.id}`}
                                className="text-primary hover:underline truncate"
                              >
                                {doc.matter.title}
                              </Link>
                            </div>
                          )}

                          {doc.deadlines.length > 0 && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(
                                  doc.deadlines[0].dueDate
                                ).toLocaleDateString(
                                  locale === "el" ? "el-GR" : "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </span>
                            </div>
                          )}

                          {analysis?.legalCategory && (
                            <span className="px-2 py-0.5 rounded bg-muted flex-shrink-0">
                              {analysis.legalCategory}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-shrink-0">
                        <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {locale === "el" ? "Άνοιγμα" : "Open"}
                          </a>
                        </Button>
                        <Button size="sm" asChild className="w-full sm:w-auto">
                          <Link
                            href={`/${locale}/dashboard/documents/${doc.id}`}
                          >
                            <MessageSquare className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">{locale === "el" ? "Chat" : "Chat"}</span>
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

