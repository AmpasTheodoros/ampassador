const stats = [
  {
    value: "50+",
    label: "Projects Delivered",
  },
  {
    value: "100%",
    label: "On-Time Delivery",
  },
  {
    value: "98%",
    label: "Client Satisfaction",
  },
  {
    value: "$10M+",
    label: "Cost Savings Generated",
  },
];

const Stats = () => {
  return (
    <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-linear-to-br from-accent to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Proven Track Record in Legal Technology
          </h2>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Delivering measurable results through innovative solutions
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-5xl md:text-6xl font-bold mb-2 text-accent">
                {stat.value}
              </div>
              <div className="text-lg text-primary-foreground/90">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;

