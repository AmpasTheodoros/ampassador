import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrgId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { DocumentChat } from "@/components/dashboard/document-chat";
import { ArrowLeft, FileText, Calendar, Users, AlertCircle } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = getTranslations(locale as Locale);
  const clerkOrgId = await getOrgId();

  if (!clerkOrgId) {
    notFound();
  }

  // Fetch document with all related data
  const document = await prisma.document.findFirst({
    where: {
      id,
      clerkOrgId,
    },
    include: {
      matter: {
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
        },
      },
      deadlines: {
        orderBy: {
          dueDate: "asc",
        },
        take: 10,
      },
    },
  });

  if (!document) {
    notFound();
  }

  const analysis = document.aiAnalysis as any;

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/dashboard/documents`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {locale === "el" ? "Λεπτομέρειες Εγγράφου" : "Document Details"}
          </h1>
          <p className="text-muted-foreground">{document.fileName}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Chat */}
        <div className="lg:col-span-2">
          <DocumentChat
            documentId={document.id}
            documentName={document.fileName}
            locale={locale as Locale}
          />
        </div>

        {/* Sidebar - Document Info */}
        <div className="space-y-4">
          {/* Document File Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {locale === "el" ? "Πληροφορίες Αρχείου" : "File Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">
                  {locale === "el" ? "Όνομα Αρχείου" : "File Name"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {document.fileName}
                </p>
              </div>
              {document.fileSize && (
                <div>
                  <p className="text-sm font-medium">
                    {locale === "el" ? "Μέγεθος" : "Size"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(document.fileSize / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}
              {document.matter && (
                <div>
                  <p className="text-sm font-medium">
                    {locale === "el" ? "Υπόθεση" : "Matter"}
                  </p>
                  <Link
                    href={`/${locale}/dashboard/matters/${document.matter.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {document.matter.title}
                  </Link>
                </div>
              )}
              <div>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a
                    href={document.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {locale === "el"
                      ? "Άνοιγμα Αρχείου"
                      : "Open File"}
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis Summary */}
          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  {locale === "el" ? "AI Ανάλυση" : "AI Analysis"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.summary && (
                  <div>
                    <p className="text-sm font-medium mb-1">
                      {locale === "el" ? "Περίληψη" : "Summary"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {analysis.summary}
                    </p>
                  </div>
                )}

                {analysis.legalCategory && (
                  <div>
                    <p className="text-sm font-medium mb-1">
                      {locale === "el" ? "Κατηγορία" : "Category"}
                    </p>
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-muted">
                      {analysis.legalCategory}
                    </span>
                  </div>
                )}

                {analysis.urgency && (
                  <div>
                    <p className="text-sm font-medium mb-1">
                      {locale === "el" ? "Επείγον" : "Urgency"}
                    </p>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        analysis.urgency === "HIGH"
                          ? "bg-destructive/10 text-destructive"
                          : analysis.urgency === "MEDIUM"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-muted"
                      }`}
                    >
                      {analysis.urgency}
                    </span>
                  </div>
                )}

                {analysis.parties && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {locale === "el" ? "Μέρη" : "Parties"}
                    </p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {analysis.parties.plaintiff && (
                        <p>
                          <strong>{locale === "el" ? "Ενάγων:" : "Plaintiff:"}</strong>{" "}
                          {analysis.parties.plaintiff}
                        </p>
                      )}
                      {analysis.parties.defendant && (
                        <p>
                          <strong>
                            {locale === "el" ? "Εναγόμενος:" : "Defendant:"}
                          </strong>{" "}
                          {analysis.parties.defendant}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Deadlines */}
          {document.deadlines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {locale === "el" ? "Προθεσμίες" : "Deadlines"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {document.deadlines.map((deadline) => (
                    <div
                      key={deadline.id}
                      className={`p-2 rounded border ${
                        deadline.status === "OVERDUE"
                          ? "border-destructive bg-destructive/5"
                          : "border-muted"
                      }`}
                    >
                      <p className="text-sm font-medium">{deadline.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(deadline.dueDate).toLocaleDateString(
                          locale === "el" ? "el-GR" : "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

