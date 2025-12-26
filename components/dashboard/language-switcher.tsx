"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, Check } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const localeNames: Record<Locale, string> = {
  en: "ENGLISH",
  el: "ΕΛΛΗΝΙΚΑ",
};

const localeFlags: Record<Locale, string> = {
  en: "🇬🇧",
  el: "🇬🇷",
};

export function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const switchLocale = (newLocale: Locale) => {
    // Replace the current locale in the pathname with the new locale
    const pathnameWithoutLocale = pathname.replace(`/${currentLocale}`, "");
    const newPath = `/${newLocale}${pathnameWithoutLocale}`;
    router.push(newPath);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-8 px-3 gap-2 border border-sidebar-border rounded-md bg-sidebar hover:bg-sidebar-accent text-sidebar-foreground",
          isOpen && "bg-sidebar-accent"
        )}
      >
        <span className="text-base">{localeFlags[currentLocale]}</span>
        <ChevronUp className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
          {locales.map((locale) => (
            <button
              key={locale}
              onClick={() => switchLocale(locale)}
              className={cn(
                "w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors",
                currentLocale === locale && "bg-gray-50"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{localeFlags[locale]}</span>
                <span className="text-sm font-medium text-gray-900">
                  {localeNames[locale]}
                </span>
              </div>
              {currentLocale === locale && (
                <Check className="h-4 w-4 text-green-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

