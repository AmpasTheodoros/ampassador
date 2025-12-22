import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText,
  Sparkles 
} from "lucide-react";
import { getTranslations } from "@/lib/translations";
import { LanguageSwitcher } from "@/components/dashboard/language-switcher";
import type { Locale } from "@/lib/i18n";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getTranslations(locale as Locale);

  const navItems = [
    {
      label: t("dashboard.navigation.overview"),
      href: `/${locale}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      label: t("dashboard.navigation.leads"),
      href: `/${locale}/dashboard/leads`,
      icon: Users,
    },
    {
      label: t("dashboard.navigation.matters"),
      href: `/${locale}/dashboard/matters`,
      icon: Briefcase,
    },
    {
      label: t("dashboard.navigation.documents"),
      href: `/${locale}/dashboard/documents`,
      icon: FileText,
    },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-sidebar border-sidebar-border p-6 flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="font-bold text-xl tracking-tighter text-sidebar-primary">
            LAW360_
          </div>
          <LanguageSwitcher currentLocale={locale as Locale} />
        </div>
        
        <div className="w-full">
          <OrganizationSwitcher 
            hidePersonal 
            appearance={{ 
              elements: { 
                rootBox: "w-full",
                organizationSwitcherTrigger: "w-full justify-start px-3 py-2 border border-sidebar-border rounded-md hover:bg-sidebar-accent text-sidebar-foreground",
                organizationSwitcherTriggerIcon: "text-sidebar-foreground",
                organizationPreview: "px-3 py-2",
                organizationPreviewText: "text-sm font-medium text-sidebar-foreground",
                organizationPreviewSecondaryIdentifier: "text-xs text-sidebar-foreground/70"
              } 
            }} 
          />
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.href}
                variant="ghost"
                className="justify-start w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground"
                asChild
              >
                <Link href={item.href}>
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>

        <div className="mt-auto">
          <UserButton showName />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}

