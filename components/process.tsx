import { Search, Lightbulb, Cog, Rocket } from "lucide-react";
import { getTranslations } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";

const Process = ({ locale }: { locale: Locale }) => {
  const t = getTranslations(locale);
  
  const steps = [
    {
      icon: Search,
      title: t("process.steps.discovery.title"),
      description: t("process.steps.discovery.description"),
    },
    {
      icon: Lightbulb,
      title: t("process.steps.strategy.title"),
      description: t("process.steps.strategy.description"),
    },
    {
      icon: Cog,
      title: t("process.steps.implementation.title"),
      description: t("process.steps.implementation.description"),
    },
    {
      icon: Rocket,
      title: t("process.steps.optimization.title"),
      description: t("process.steps.optimization.description"),
    },
  ];
  return (
    <section id="process" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t("process.title")}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("process.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="text-center">
                <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent text-accent-foreground">
                  <step.icon className="h-10 w-10" />
                </div>
                <div className="text-6xl font-bold text-secondary/30 absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-accent to-transparent" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Process;

