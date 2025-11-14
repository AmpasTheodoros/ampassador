"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Linkedin, Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactFormSchema, type ContactFormData } from "@/lib/validations";
import { useToast } from "@/hooks/use-toast";
import { getTranslations } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";

const Contact = ({ locale }: { locale: Locale }) => {
  const { toast } = useToast();
  const t = getTranslations(locale);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to submit message");
      }

      toast({
        title: t("contact.successTitle"),
        description: t("contact.successDescription"),
      });

      reset();
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast({
        title: t("contact.errorTitle"),
        description: t("contact.errorDescription"),
        variant: "destructive",
      });
    }
  };

  return (
    <section id="contact" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{t("contact.title")}</h2>
            <p className="text-xl text-muted-foreground">
              {t("contact.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Input {...register("name")} placeholder={t("contact.namePlaceholder")} className="h-12" disabled={isSubmitting} />
                  {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <Input
                    {...register("email")}
                    type="email"
                    placeholder={t("contact.emailPlaceholder")}
                    className="h-12"
                    disabled={isSubmitting}
                  />
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <Input
                    {...register("company")}
                    placeholder={t("contact.companyPlaceholder")}
                    className="h-12"
                    disabled={isSubmitting}
                  />
                  {errors.company && <p className="text-sm text-destructive mt-1">{errors.company.message}</p>}
                </div>

                <div>
                  <Textarea
                    {...register("message")}
                    placeholder={t("contact.messagePlaceholder")}
                    className="min-h-[150px]"
                    disabled={isSubmitting}
                  />
                  {errors.message && <p className="text-sm text-destructive mt-1">{errors.message.message}</p>}
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? t("contact.sending") : t("contact.submitButton")}
                </Button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-semibold text-foreground mb-6">{t("contact.connectTitle")}</h3>
                <div className="space-y-4">
                  <a
                    href="mailto:info@ampassador.com"
                    className="flex items-center gap-4 text-muted-foreground hover:text-accent transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-accent/10 group-hover:bg-accent group-hover:text-accent-foreground transition-colors flex items-center justify-center">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{t("contact.email")}</p>
                      <p>info@ampassador.com</p>
                    </div>
                  </a>

                  <a
                    href="tel:+306978100951"
                    className="flex items-center gap-4 text-muted-foreground hover:text-accent transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-accent/10 group-hover:bg-accent group-hover:text-accent-foreground transition-colors flex items-center justify-center">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{t("contact.phone")}</p>
                      <p>+30 697 810 0951</p>
                    </div>
                  </a>

                  <a
                    href="https://www.linkedin.com/company/ampassador/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 text-muted-foreground hover:text-accent transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-accent/10 group-hover:bg-accent group-hover:text-accent-foreground transition-colors flex items-center justify-center">
                      <Linkedin className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{t("contact.linkedin")}</p>
                      <p>{t("contact.linkedinText")}</p>
                    </div>
                  </a>
                </div>
              </div>

              <div className="p-6 rounded-lg bg-card border border-border">
                <h4 className="font-semibold text-foreground mb-2">{t("contact.responseTimeTitle")}</h4>
                <p className="text-muted-foreground">
                  {t("contact.responseTimeDescription")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;

