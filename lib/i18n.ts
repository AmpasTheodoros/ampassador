import { notFound } from 'next/navigation';

// Supported locales
export const locales = ['en', 'el'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

// Load messages for a given locale
export async function getMessages(locale: Locale) {
  try {
    return (await import(`@/messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }
}

// Get translation function
export function getTranslations(locale: Locale) {
  return async function t(key: string): Promise<string> {
    const messages = await getMessages(locale);
    const keys = key.split('.');
    let value: any = messages;
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        console.warn(`Translation key "${key}" not found for locale "${locale}"`);
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };
}

// Helper to get nested translation
export function getNestedTranslation(messages: any, key: string): string {
  const keys = key.split('.');
  let value: any = messages;
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      console.warn(`Translation key "${key}" not found`);
      return key;
    }
  }
  
  return typeof value === 'string' ? value : key;
}

