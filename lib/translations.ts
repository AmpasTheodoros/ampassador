import enMessages from "@/messages/en.json";
import elMessages from "@/messages/el.json";
import type { Locale } from "./i18n";

type Messages = typeof enMessages;

const messages: Record<Locale, Messages> = {
  en: enMessages,
  el: elMessages,
};

export function getTranslations(locale: Locale) {
  return function t(key: string): string {
    const keys = key.split(".");
    let value: any = messages[locale];

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        console.warn(`Translation key "${key}" not found for locale "${locale}"`);
        return key;
      }
    }

    return typeof value === "string" ? value : key;
  };
}

export function getNestedTranslation(locale: Locale, key: string): any {
  const keys = key.split(".");
  let value: any = messages[locale];

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      console.warn(`Translation key "${key}" not found for locale "${locale}"`);
      return null;
    }
  }

  return value;
}

