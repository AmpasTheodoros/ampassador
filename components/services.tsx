import { Scale, Cpu, TrendingUp, Users, Zap, Shield } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const services = [
  {
    icon: Scale,
    title: "Legal Process Optimization",
    description: "Streamline workflows and reduce operational costs through intelligent automation and process design",
  },
  {
    icon: Cpu,
    title: "Technology Implementation",
    description: "Deploy and integrate cutting-edge legal tech solutions tailored to your organization's needs",
  },
  {
    icon: TrendingUp,
    title: "Strategic Consulting",
    description: "Develop comprehensive digital transformation strategies for legal departments and law firms",
  },
  {
    icon: Users,
    title: "Team Training & Adoption",
    description: "Ensure successful technology adoption through comprehensive training and change management",
  },
  {
    icon: Zap,
    title: "Innovation & AI",
    description: "Leverage artificial intelligence and machine learning to enhance legal service delivery",
  },
  {
    icon: Shield,
    title: "Compliance & Security",
    description: "Implement robust security measures and ensure compliance with industry regulations",
  },
];

const Services = () => {
  return (
    <section id="services" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Comprehensive LegalTech Solutions
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Bridging the gap between legal expertise and technological innovation
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

