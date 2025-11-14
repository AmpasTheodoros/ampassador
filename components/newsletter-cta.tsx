"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { emailCaptureSchema, type EmailCaptureData } from "@/lib/validations";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";
import { getTranslations } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";

const NewsletterCTA = ({ locale }: { locale: Locale }) => {
  const { toast } = useToast();
  const t = getTranslations(locale);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EmailCaptureData>({
    resolver: zodResolver(emailCaptureSchema),
  });

  const onSubmit = async (data: EmailCaptureData) => {
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Handle duplicate email error gracefully
        if (result.error === "DUPLICATE_EMAIL" || response.status === 409) {
          toast({
            title: t("newsletter.alreadySubscribedTitle"),
            description: t("newsletter.alreadySubscribedDescription"),
          });
          reset();
          return;
        }
        throw new Error(result.error || "Failed to subscribe");
      }

      toast({
        title: t("newsletter.successTitle"),
        description: t("newsletter.successDescription"),
      });

      reset();
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      toast({
        title: t("newsletter.errorTitle"),
        description: t("newsletter.errorDescription"),
        variant: "destructive",
      });
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-primary via-primary/90 to-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent text-accent-foreground mb-6">
            <Mail className="h-8 w-8" />
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            {t("newsletter.title")}
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            {t("newsletter.subtitle")}
          </p>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto"
          >
            <div className="flex-1">
              <Input
                {...register("email")}
                type="email"
                placeholder={t("newsletter.emailPlaceholder")}
                className="h-14 bg-card text-foreground text-lg"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-accent mt-1 text-left">{errors.email.message}</p>
              )}
            </div>
            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="h-14 px-8 text-lg whitespace-nowrap"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("newsletter.subscribing") : t("newsletter.submitButton")}
            </Button>
          </form>
          <p className="text-sm text-primary-foreground/70 mt-4">
            {t("newsletter.footer")}
          </p>
        </div>
      </div>
    </section>
  );
};

export default NewsletterCTA;

