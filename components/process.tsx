import { Search, Lightbulb, Cog, Rocket } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Discovery & Analysis",
    description: "Deep dive into your current processes, pain points, and goals to identify opportunities for improvement",
  },
  {
    icon: Lightbulb,
    title: "Strategy Development",
    description: "Create a customized roadmap with clear milestones and measurable outcomes aligned with your objectives",
  },
  {
    icon: Cog,
    title: "Implementation",
    description: "Deploy solutions with minimal disruption, ensuring seamless integration with existing systems",
  },
  {
    icon: Rocket,
    title: "Optimization & Scale",
    description: "Continuously monitor, refine, and scale solutions to maximize ROI and long-term success",
  },
];

const Process = () => {
  return (
    <section id="process" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            A Proven Approach
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From concept to implementation and beyond
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

