import { Linkedin, Mail } from "lucide-react";
import { getTranslations } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";

const Footer = ({ locale }: { locale: Locale }) => {
  const t = getTranslations(locale);
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold mb-4">{t("header.logo")}</h3>
            <p className="text-primary-foreground/80 mb-4">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">{t("footer.quickLinks")}</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li>
                <a href="#services" className="hover:text-accent transition-colors">
                  {t("header.services")}
                </a>
              </li>
              <li>
                <a href="#process" className="hover:text-accent transition-colors">
                  {t("header.process")}
                </a>
              </li>
              <li>
                <a href="#testimonials" className="hover:text-accent transition-colors">
                  {t("header.testimonials")}
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-accent transition-colors">
                  {t("header.contact")}
                </a>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="font-semibold mb-4">{t("footer.connect")}</h4>
            <div className="flex gap-4">
              <a
                href="https://www.linkedin.com/company/ampassador/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-primary-foreground/10 hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-center"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="mailto:info@ampassador.com"
                className="w-10 h-10 rounded-lg bg-primary-foreground/10 hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-center"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-8 text-center text-primary-foreground/80">
          <p>© {new Date().getFullYear()} {t("header.logo")}. {t("footer.copyright")}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

