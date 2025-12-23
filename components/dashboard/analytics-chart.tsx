"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Euro } from "lucide-react";
import { getTranslations } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";

interface AnalyticsData {
  date: string;
  dateLabel: string;
  leads: number;
  revenue: number;
  conversions: number;
}

interface AnalyticsChartProps {
  data: AnalyticsData[];
  locale: Locale;
}

/**
 * Analytics Chart Component
 * 
 * Displays revenue and leads trends using Recharts
 */
export function AnalyticsChart({ data, locale }: AnalyticsChartProps) {
  const t = getTranslations(locale);
  
  // Format currency for tooltip
  const formatCurrency = (value: number) => {
    const localeCode = locale === "el" ? "el-GR" : "en-GB";
    return new Intl.NumberFormat(localeCode, {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Custom tooltip for revenue chart
  const RevenueTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium mb-1">{payload[0].payload.dateLabel}</p>
          <p className="text-sm text-accent font-semibold">
            {t("dashboard.analytics.revenueLabel")}: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for leads chart
  const LeadsTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium mb-1">{payload[0].payload.dateLabel}</p>
          <p className="text-sm text-primary font-semibold">
            {t("dashboard.analytics.newLeadsLabel")}: {payload[0].value}
          </p>
          {payload[0].payload.conversions > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {t("dashboard.analytics.conversionsLabel")}: {payload[0].payload.conversions}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Calculate totals for summary
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalLeads = data.reduce((sum, d) => sum + d.leads, 0);
  const totalConversions = data.reduce((sum, d) => sum + d.conversions, 0);
  const conversionRate = totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.analytics.totalRevenue")}</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("dashboard.analytics.lastDays").replace("{days}", data.length.toString())}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.analytics.newLeads")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalConversions} {t("dashboard.analytics.conversions")} ({conversionRate.toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.analytics.averagePerDay")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue / Math.max(data.length, 1))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(totalLeads / Math.max(data.length, 1)).toFixed(1)} {t("dashboard.analytics.leadsPerDay")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-accent" />
              {t("dashboard.analytics.revenueEUR")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis
                    dataKey="dateLabel"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `€${value}`}
                  />
                  <Tooltip content={<RevenueTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--accent))", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Leads Volume Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {t("dashboard.analytics.newLeadsLabel")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis
                    dataKey="dateLabel"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<LeadsTooltip />} />
                  <Bar
                    dataKey="leads"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

