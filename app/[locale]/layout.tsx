import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { locales, defaultLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// SEO-optimized metadata for each locale
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ampassador.com";

  // Get translations for metadata
  const messages = await import(`@/messages/${locale}.json`);
  const t = messages.default;

  const metadata: Metadata = {
    title: {
      default: locale === "en" 
        ? "Ampassador - LegalTech Solutions & Digital Transformation"
        : "Ampassador - Λύσεις LegalTech & Ψηφιακός Μετασχηματισμός",
      template: "%s | Ampassador",
    },
    description: locale === "en"
      ? "Expert LegalTech solutions, process optimization, and digital transformation for modern legal teams. Transform your legal operations through innovative technology."
      : "Ειδικές λύσεις LegalTech, βελτιστοποίηση διαδικασιών και ψηφιακός μετασχηματισμός για σύγχρονες νομικές ομάδες. Μετασχηματίστε τις νομικές σας λειτουργίες μέσω καινοτόμων τεχνολογιών.",
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        en: `${baseUrl}/en`,
        el: `${baseUrl}/el`,
        "x-default": `${baseUrl}/${defaultLocale}`,
      },
    },
    openGraph: {
      title: locale === "en"
        ? "Ampassador - LegalTech Solutions"
        : "Ampassador - Λύσεις LegalTech",
      description: locale === "en"
        ? "Transforming legal operations through innovative technology solutions"
        : "Μετασχηματίζοντας τις νομικές λειτουργίες μέσω καινοτόμων τεχνολογικών λύσεων",
      url: `${baseUrl}/${locale}`,
      siteName: "Ampassador",
      locale: locale === "en" ? "en_US" : "el_GR",
      alternateLocale: locale === "en" ? "el_GR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: locale === "en"
        ? "Ampassador - LegalTech Solutions"
        : "Ampassador - Λύσεις LegalTech",
      description: locale === "en"
        ? "Transforming legal operations through innovative technology solutions"
        : "Μετασχηματίζοντας τις νομικές λειτουργίες μέσω καινοτόμων τεχνολογικών λύσεων",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };

  return metadata;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

