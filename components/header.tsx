"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTranslations } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";
import { useRouter, usePathname } from "next/navigation";

const Header = ({ locale }: { locale: Locale }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const t = getTranslations(locale);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isLangMenuOpen && !(event.target as Element).closest('.language-menu')) {
        setIsLangMenuOpen(false);
      }
    };

    if (isLangMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isLangMenuOpen]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      setIsMobileMenuOpen(false);
    }
  };

  const switchLanguage = (newLocale: Locale) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
    setIsLangMenuOpen(false);
  };

  const navItems = [
    { label: t("header.about"), id: "about" },
    { label: t("header.services"), id: "services" },
    { label: t("header.process"), id: "process" },
    { label: t("header.testimonials"), id: "testimonials" },
    { label: t("header.contact"), id: "contact" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/95 backdrop-blur-md shadow-lg border-b border-border"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-2xl font-bold hover:text-accent transition-colors"
          >
            <span className={cn(isScrolled ? "text-foreground" : "text-primary-foreground")}>
              {t("header.logo")}
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={cn(
                  "font-medium transition-colors hover:text-accent",
                  isScrolled ? "text-foreground" : "text-primary-foreground"
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Language Switcher & CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            <div className="relative language-menu">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                  isScrolled
                    ? "text-foreground hover:bg-muted"
                    : "text-primary-foreground hover:bg-primary-foreground/10"
                )}
              >
                <Globe className="h-4 w-4" />
                <span className="uppercase text-sm font-medium">{locale}</span>
              </button>
              {isLangMenuOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50">
                  <button
                    onClick={() => switchLanguage("en")}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors",
                      locale === "en" && "bg-muted font-semibold"
                    )}
                  >
                    English
                  </button>
                  <button
                    onClick={() => switchLanguage("el")}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors",
                      locale === "el" && "bg-muted font-semibold"
                    )}
                  >
                    Ελληνικά
                  </button>
                </div>
              )}
            </div>
            <Button
              variant="hero"
              size="lg"
              onClick={() => scrollToSection("contact")}
            >
              {t("header.getStarted")}
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className={cn(
                "p-2 transition-colors uppercase text-sm font-medium",
                isScrolled ? "text-foreground" : "text-primary-foreground"
              )}
            >
              {locale}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={cn(
                "p-2 transition-colors",
                isScrolled ? "text-foreground" : "text-primary-foreground"
              )}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-6 bg-background border-t border-border">
            <nav className="flex flex-col gap-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="text-left px-4 py-2 font-medium text-foreground hover:text-accent hover:bg-muted/50 rounded-lg transition-colors"
                >
                  {item.label}
                </button>
              ))}
              {isLangMenuOpen && (
                <div className="px-4 py-2 space-y-2 border-t border-border pt-4">
                  <button
                    onClick={() => switchLanguage("en")}
                    className={cn(
                      "w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      locale === "en"
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    )}
                  >
                    English
                  </button>
                  <button
                    onClick={() => switchLanguage("el")}
                    className={cn(
                      "w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      locale === "el"
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    )}
                  >
                    Ελληνικά
                  </button>
                </div>
              )}
              <div className="px-4 pt-2">
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={() => scrollToSection("contact")}
                >
                  {t("header.getStarted")}
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

