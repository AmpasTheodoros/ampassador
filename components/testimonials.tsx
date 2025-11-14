import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { getTranslations, getNestedTranslation } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";

const Testimonials = ({ locale }: { locale: Locale }) => {
  const t = getTranslations(locale);
  const testimonial1 = getNestedTranslation(locale, "testimonials.items.testimonial1");
  const testimonial2 = getNestedTranslation(locale, "testimonials.items.testimonial2");
  const testimonial3 = getNestedTranslation(locale, "testimonials.items.testimonial3");
  
  const testimonials = [
    {
      quote: testimonial1.quote,
      author: testimonial1.author,
      position: testimonial1.position,
      company: testimonial1.company,
    },
    {
      quote: testimonial2.quote,
      author: testimonial2.author,
      position: testimonial2.position,
      company: testimonial2.company,
    },
    {
      quote: testimonial3.quote,
      author: testimonial3.author,
      position: testimonial3.position,
      company: testimonial3.company,
    },
  ];
  return (
    <section id="testimonials" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t("testimonials.title")}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("testimonials.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-border hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-foreground mb-6 italic">
                  "{testimonial.quote}"
                </p>
                <div className="border-t border-border pt-4">
                  <p className="font-semibold text-foreground">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.position}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.company}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

