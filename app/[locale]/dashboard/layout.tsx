"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText,
  Menu,
  X
} from "lucide-react";
import { getTranslations } from "@/lib/translations";
import { LanguageSwitcher } from "@/components/dashboard/language-switcher";
import type { Locale } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState<Locale>("en");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    params.then(({ locale: loc }) => setLocale(loc as Locale)).catch(console.error);
  }, [params]);

  const t = getTranslations(locale);

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

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 border-r bg-sidebar border-sidebar-border p-4 lg:p-6 
          flex flex-col gap-6 lg:gap-8
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="font-bold text-xl tracking-tighter text-sidebar-primary">
            Ampassador
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher currentLocale={locale} />
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-sidebar-foreground"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
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
      <main className="flex-1 overflow-y-auto bg-background w-full lg:w-auto">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-background border-b p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="font-bold text-lg tracking-tighter">
            Ampassador
          </div>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>
        {children}
      </main>
    </div>
  );
}

