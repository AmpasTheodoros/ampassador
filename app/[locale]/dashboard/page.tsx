import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { HotLeadsList } from "@/components/dashboard/hot-leads";
import { AIInsights } from "@/components/dashboard/ai-insights";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { getOrgId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardAnalytics } from "@/lib/get-analytics";
import { 
  TrendingUp, 
  Plus,
  Sparkles,
  Euro,
  Briefcase,
  Building2
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";

export default async function DashboardPage({
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
              <Building2 className="h-8 w-8 text-muted-foreground" />
              <CardTitle className="text-2xl">
                {t("dashboard.organizationRequired")}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t("dashboard.organizationRequiredDescription")}
            </p>
            <Button asChild className="w-full">
              <Link href={`/${locale}/dashboard`}>
                {t("dashboard.refreshPage")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch dashboard stats in parallel
  const [
    newLeadsCount,
    unpaidInvoicesData,
    activeMattersCount,
    overdueInvoicesData,
    analyticsData,
  ] = await Promise.all([
    // New leads count
    prisma.lead.count({
      where: { clerkOrgId, status: "NEW" },
    }),
    // Unpaid invoices
    prisma.invoice.aggregate({
      where: {
        clerkOrgId,
        status: "UNPAID",
      },
      _sum: {
        amount: true,
      },
      _count: true,
    }),
    // Active matters
    prisma.matter.count({
      where: { clerkOrgId, status: "ACTIVE" },
    }),
    // Overdue invoices (unpaid + past due date)
    prisma.invoice.aggregate({
      where: {
        clerkOrgId,
        status: "UNPAID",
        dueDate: {
          lt: new Date(),
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    }),
    // Analytics data (last 7 days)
    getDashboardAnalytics(clerkOrgId, 7),
  ]);

  // Calculate AI time saved (placeholder - can be calculated from actual usage)
  const aiTimeSaved = "14h"; // TODO: Calculate from actual AI usage

  const unpaidAmount = unpaidInvoicesData._sum.amount || 0;
  const overdueCount = overdueInvoicesData._count;
  const overdueAmount = overdueInvoicesData._sum.amount || 0;

  // Format currency (EUR)
  const formatCurrency = (amount: number) => {
    const localeCode = locale === "el" ? "el-GR" : "en-GB";
    return new Intl.NumberFormat(localeCode, {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 lg:space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {t("dashboard.greeting")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href={`/${locale}/dashboard/matters/new`}>
            <Plus className="h-4 w-4 mr-2" />
            {t("dashboard.newMatter")}
          </Link>
        </Button>
      </div>

      {/* Stats Row - 4 Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("dashboard.stats.newLeads")}
          value={newLeadsCount}
          description={t("dashboard.stats.newLeadsDescription")}
          icon={TrendingUp}
          trend={{ value: "+2", isPositive: true }}
        />
        <StatCard
          title={t("dashboard.stats.pendingPayments")}
          value={formatCurrency(unpaidAmount)}
          description={`${overdueInvoicesData._count} ${t("dashboard.stats.pendingPaymentsOverdue")}`}
          icon={Euro}
          trend={
            overdueCount > 0
              ? { value: `${overdueCount} ${t("dashboard.stats.pendingPaymentsOverdue")}`, isPositive: false }
              : undefined
          }
        />
        <StatCard
          title={t("dashboard.stats.activeMatters")}
          value={activeMattersCount}
          description={t("dashboard.stats.activeMattersDescription")}
          icon={Briefcase}
        />
        <StatCard
          title={t("dashboard.stats.aiTimeSaved")}
          value={aiTimeSaved}
          description={t("dashboard.stats.aiTimeSavedDescription")}
          icon={Sparkles}
        />
      </div>

      {/* Analytics Charts */}
      <AnalyticsChart data={analyticsData} locale={locale as Locale} />

      {/* Bento Grid: Main Content + Sidebar */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Main Feed: Hot Leads (AI Powered) - 4 columns */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                {t("dashboard.hotLeads.title")}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="w-full sm:w-auto">
                <Link href={`/${locale}/dashboard/leads`}>
                  {t("dashboard.hotLeads.viewAll")}
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <HotLeadsList locale={locale as Locale} />
          </CardContent>
        </Card>

        {/* Sidebar Feed: AI Insights - 3 columns */}
        <div className="lg:col-span-3 space-y-4">
          <AIInsights locale={locale as Locale} />
        </div>
      </div>
    </div>
  );
}

