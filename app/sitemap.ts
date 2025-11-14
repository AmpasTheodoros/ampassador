import { MetadataRoute } from "next";
import { locales, defaultLocale } from "@/lib/i18n";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ampassador.com";

  // Generate sitemap entries for each locale
  const routes = [
    "", // Home page
    // Add more routes here as your site grows
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  locales.forEach((locale) => {
    routes.forEach((route) => {
      const path = route ? `/${locale}/${route}` : `/${locale}`;
      sitemapEntries.push({
        url: `${baseUrl}${path}`,
        lastModified: new Date(),
        changeFrequency: locale === defaultLocale ? "weekly" : "monthly",
        priority: route === "" ? 1.0 : 0.8,
        alternates: {
          languages: Object.fromEntries(
            locales.map((loc) => [
              loc,
              `${baseUrl}${route ? `/${loc}/${route}` : `/${loc}`}`,
            ])
          ),
        },
      });
    });
  });

  return sitemapEntries;
}

