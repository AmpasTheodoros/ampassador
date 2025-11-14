import { Card, CardContent } from "@/components/ui/card";

import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "Transformed our legal operations completely. We've seen a 40% reduction in processing time and significantly improved team satisfaction.",
    author: "Sarah Johnson",
    position: "General Counsel",
    company: "TechCorp International",
  },
  {
    quote: "The strategic insights and technology implementation were game-changing. Our firm is now equipped to handle the demands of modern legal practice.",
    author: "Michael Chen",
    position: "Managing Partner",
    company: "Chen & Associates",
  },
  {
    quote: "An exceptional partner in our digital transformation journey. The ROI exceeded our expectations within the first year.",
    author: "Emily Rodriguez",
    position: "Chief Operations Officer",
    company: "Global Legal Services",
  },
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Client Success Stories
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Trusted by leading legal professionals and organizations
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

