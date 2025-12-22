import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrgId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Briefcase, Plus } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";

export default async function MattersPage({
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
              <Briefcase className="h-8 w-8 text-muted-foreground" />
              <CardTitle className="text-2xl">
                {t("dashboard.matters.organizationRequired")}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t("dashboard.matters.organizationRequiredDescription")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch matters
  const matters = await prisma.matter.findMany({
    where: { clerkOrgId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-8 p-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("dashboard.matters.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("dashboard.matters.subtitle")}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/dashboard/matters/new`}>
            <Plus className="h-4 w-4 mr-2" />
            {t("dashboard.matters.newMatter")}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.matters.allMatters")}</CardTitle>
        </CardHeader>
        <CardContent>
          {matters.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("dashboard.matters.noMatters")}</p>
              <Button asChild className="mt-4">
                <Link href={`/${locale}/dashboard/matters/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("dashboard.matters.createFirstMatter")}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {matters.map((matter) => (
                <Link
                  key={matter.id}
                  href={`/${locale}/dashboard/matters/${matter.id}`}
                  className="block border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">
                        {matter.title || t("dashboard.matters.untitledMatter")}
                      </h3>
                      {matter.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {matter.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-1 rounded-full bg-muted">
                        {matter.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

