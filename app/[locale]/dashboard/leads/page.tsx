import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrgId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Users } from "lucide-react";
import { getTranslations } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";

export default async function LeadsPage({
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
              <Users className="h-8 w-8 text-muted-foreground" />
              <CardTitle className="text-2xl">
                {t("dashboard.leads.organizationRequired")}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t("dashboard.leads.organizationRequiredDescription")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch leads
  const leads = await prisma.lead.findMany({
    where: { clerkOrgId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-8 p-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("dashboard.leads.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("dashboard.leads.subtitle")}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.leads.allLeads")}</CardTitle>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("dashboard.leads.noLeads")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">
                        {lead.name || lead.email || t("dashboard.leads.unnamedLead")}
                      </h3>
                      {lead.email && (
                        <p className="text-sm text-muted-foreground">
                          {lead.email}
                        </p>
                      )}
                      {lead.phone && (
                        <p className="text-sm text-muted-foreground">
                          {lead.phone}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-1 rounded-full bg-muted">
                        {lead.status}
                      </span>
                    </div>
                  </div>
                  {lead.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {lead.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

