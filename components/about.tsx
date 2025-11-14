import { Award, Briefcase, Users, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const highlights = [
  {
    icon: Award,
    value: "100%",
    label: "On-Time Delivery",
  },
  {
    icon: Briefcase,
    value: "50+",
    label: "Projects Completed",
  },
  {
    icon: Users,
    value: "100+",
    label: "Clients Served",
  },
  {
    icon: TrendingUp,
    value: "$10M+",
    label: "Cost Savings",
  },
];

const About = () => {
  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Bridging Law and Technology
            </h2>
            <div className="space-y-4 text-lg text-muted-foreground">
              <p>
                At the intersection of legal practice and technology,
                I've helped organizations transform their legal operations through strategic technology
                implementation and process optimization.
              </p>
              <p>
                My approach combines deep legal industry knowledge with cutting-edge technology expertise
                to deliver solutions that are both practical and transformative. From global law firms to
                corporate legal departments, I've consistently delivered measurable results that drive
                efficiency, reduce costs, and enhance service delivery.
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

