"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import type { Locale } from "@/lib/i18n";

// This is a simplified version - in production, you might want to use next-intl or similar
export function useTranslations() {
  const params = useParams();
  const locale = (params?.locale as Locale) || "en";

  const t = useMemo(() => {
    return async (key: string): Promise<string> => {
      try {
        const messages = await import(`@/messages/${locale}.json`);
        const keys = key.split(".");
        let value: any = messages.default;

        for (const k of keys) {
          value = value?.[k];
          if (value === undefined) {
            console.warn(`Translation key "${key}" not found for locale "${locale}"`);
            return key;
          }
        }

        return typeof value === "string" ? value : key;
      } catch (error) {
        console.error(`Error loading translations for locale "${locale}":`, error);
        return key;
      }
    };
  }, [locale]);

  // Synchronous version for client components
  const tSync = (key: string): string => {
    try {
      // This will be populated by the server component
      return key;
    } catch {
      return key;
    }
  };

  return { t, tSync, locale };
}

