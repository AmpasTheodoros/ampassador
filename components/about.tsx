import { Award, Briefcase, Users, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getTranslations } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";

const About = ({ locale }: { locale: Locale }) => {
  const t = getTranslations(locale);
  
  const highlights = [
    {
      icon: Award,
      value: "100%",
      label: t("about.onTimeDelivery"),
    },
    {
      icon: Briefcase,
      value: "50+",
      label: t("about.projectsCompleted"),
    },
    {
      icon: Users,
      value: "100+",
      label: t("about.clientsServed"),
    },
    {
      icon: TrendingUp,
      value: "$10M+",
      label: t("about.costSavings"),
    },
  ];
  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              {t("about.title")}
            </h2>
            <div className="space-y-4 text-lg text-muted-foreground">
              <p>
                {t("about.paragraph1")}
              </p>
              <p>
                {t("about.paragraph2")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            {highlights.map((highlight, index) => (
              <Card key={index} className="text-center border-border hover:border-accent transition-colors">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent/10 text-accent mb-3">
                    <highlight.icon className="h-6 w-6" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {highlight.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {highlight.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;

