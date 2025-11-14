import Header from "@/components/header";
import Hero from "@/components/hero";
import About from "@/components/about";
import Services from "@/components/services";
import Stats from "@/components/stats";
import Process from "@/components/process";
import AuditForm from "@/components/audit-form";
import Testimonials from "@/components/testimonials";
import NewsletterCTA from "@/components/newsletter-cta";
import Contact from "@/components/contact";
import Footer from "@/components/footer";
import { getTranslations } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = getTranslations(locale);

  return (
    <div>
      <Header locale={locale} />
      <Hero locale={locale} />
      <About locale={locale} />
      <Services locale={locale} />
      <Stats locale={locale} />
      <Process locale={locale} />
      <AuditForm locale={locale} />
      <Testimonials locale={locale} />
      <NewsletterCTA locale={locale} />
      <Contact locale={locale} />
      <Footer locale={locale} />
    </div>
  );
}

