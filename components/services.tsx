import { Scale, Cpu, TrendingUp, Users, Zap, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getTranslations } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";

const Services = ({ locale }: { locale: Locale }) => {
  const t = getTranslations(locale);
  
  const services = [
    {
      icon: Scale,
      title: t("services.items.processOptimization.title"),
      description: t("services.items.processOptimization.description"),
    },
    {
      icon: Cpu,
      title: t("services.items.techImplementation.title"),
      description: t("services.items.techImplementation.description"),
    },
    {
      icon: TrendingUp,
      title: t("services.items.strategicConsulting.title"),
      description: t("services.items.strategicConsulting.description"),
    },
    {
      icon: Users,
      title: t("services.items.training.title"),
      description: t("services.items.training.description"),
    },
    {
      icon: Zap,
      title: t("services.items.innovation.title"),
      description: t("services.items.innovation.description"),
    },
    {
      icon: Shield,
      title: t("services.items.compliance.title"),
      description: t("services.items.compliance.description"),
    },
  ];
  return (
    <section id="services" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t("services.title")}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("services.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className="border-border hover:border-accent transition-all duration-300 hover:shadow-lg group"
            >
              <CardContent className="p-6">
                <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-lg bg-blue-light text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors duration-300">
                  <service.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {service.title}
                </h3>
                <p className="text-muted-foreground">
                  {service.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;

