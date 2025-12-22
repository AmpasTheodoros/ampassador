"use client";

import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const localeNames: Record<Locale, string> = {
  en: "English",
  el: "Ελληνικά",
};

export function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: Locale) => {
    // Replace the current locale in the pathname with the new locale
    const pathnameWithoutLocale = pathname.replace(`/${currentLocale}`, "");
    const newPath = `/${newLocale}${pathnameWithoutLocale}`;
    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-1 border border-sidebar-border rounded-md p-1 bg-sidebar">
      <Globe className="h-4 w-4 mr-1 text-sidebar-foreground/70" />
      {locales.map((locale) => (
        <Button
          key={locale}
          variant={currentLocale === locale ? "default" : "ghost"}
          size="sm"
          onClick={() => switchLocale(locale)}
          className={cn(
            "h-7 px-2 text-xs",
            currentLocale === locale 
              ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          {localeNames[locale]}
        </Button>
      ))}
    </div>
  );
}

