import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrgId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ArrowLeft, Briefcase, Calendar, DollarSign, FileText } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";

export default async function MatterDetailPage({
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

  // Fetch matter with all related data
  const matter = await prisma.matter.findFirst({
    where: {
      id,
      clerkOrgId,
    },
    include: {
      convertedLeads: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
        take: 5,
      },
      documents: {
        select: {
          id: true,
          fileName: true,
          createdAt: true,
        },
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
      },
      invoices: {
        select: {
          id: true,
          amount: true,
          status: true,
          dueDate: true,
        },
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!matter) {
    notFound();
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/dashboard/matters`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {matter.title || t("dashboard.matters.untitledMatter")}
          </h1>
          <p className="text-muted-foreground">
            {locale === "el" ? "Λεπτομέρειες Υπόθεσης" : "Matter Details"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {matter.description && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {locale === "el" ? "Περιγραφή" : "Description"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{matter.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Converted Leads */}
          {matter.convertedLeads.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {locale === "el" ? "Leads που Μετατράπηκαν" : "Converted Leads"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {matter.convertedLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-sm text-muted-foreground">{lead.email}</p>
                      </div>
                      <Link
                        href={`/${locale}/dashboard/leads`}
                        className="text-sm text-primary hover:underline"
                      >
                        {locale === "el" ? "Δείτε" : "View"}
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {matter.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {locale === "el" ? "Έγγραφα" : "Documents"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {matter.documents.map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/${locale}/dashboard/documents/${doc.id}`}
                      className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{doc.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.createdAt).toLocaleDateString(
                            locale === "el" ? "el-GR" : "en-US"
                          )}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href={`/${locale}/dashboard/documents`}>
                    {locale === "el" ? "Δείτε Όλα τα Έγγραφα" : "View All Documents"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Matter Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                {locale === "el" ? "Πληροφορίες" : "Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">
                  {locale === "el" ? "Κατάσταση" : "Status"}
                </p>
                <span className="inline-block px-2 py-1 text-xs rounded-full bg-muted">
                  {matter.status}
                </span>
              </div>

              <div>
                <p className="text-sm font-medium mb-1 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {locale === "el" ? "Τύπος Χρέωσης" : "Billing Type"}
                </p>
                <span className="text-sm text-muted-foreground">
                  {matter.billingType}
                </span>
              </div>

              {matter.deadline && (
                <div>
                  <p className="text-sm font-medium mb-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {locale === "el" ? "Προθεσμία" : "Deadline"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(matter.deadline).toLocaleDateString(
                      locale === "el" ? "el-GR" : "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-1">
                  {locale === "el" ? "Δημιουργήθηκε" : "Created"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(matter.createdAt).toLocaleDateString(
                    locale === "el" ? "el-GR" : "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Invoices Summary */}
          {matter.invoices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {locale === "el" ? "Τιμολόγια" : "Invoices"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {matter.invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {new Intl.NumberFormat(
                            locale === "el" ? "el-GR" : "en-US",
                            {
                              style: "currency",
                              currency: "EUR",
                            }
                          ).format(invoice.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {invoice.status}
                        </p>
                      </div>
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

