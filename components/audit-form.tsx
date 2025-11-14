"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { auditFormSchema, type AuditFormData } from "@/lib/validations";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";

const AuditForm = () => {
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AuditFormData>({
    resolver: zodResolver(auditFormSchema),
  });

  const onSubmit = async (data: AuditFormData) => {
    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to submit audit request");
      }

      toast({
        title: "Audit Request Received!",
        description: "Your free legal operations audit report will be delivered within 48 hours.",
      });

      reset();
    } catch (error) {
      console.error("Error submitting audit request:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-accent to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Get Your Free Legal Operations Audit
            </h2>
            <p className="text-xl text-primary-foreground/90">
              Receive a comprehensive analysis of your current processes and improvement opportunities
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-accent shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Process Efficiency Analysis</h3>
                  <p className="text-primary-foreground/80 text-sm">
                    Identify bottlenecks and optimization opportunities in your workflows
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-accent shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Technology Stack Review</h3>
                  <p className="text-primary-foreground/80 text-sm">
                    Evaluate your current tools and identify gaps or redundancies
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-accent shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Cost Savings Projection</h3>
                  <p className="text-primary-foreground/80 text-sm">
                    Get an estimated ROI for implementing recommended improvements
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Input
                  {...register("website")}
                  placeholder="Your Website URL *"
                  className="h-12 bg-card text-foreground"
                  disabled={isSubmitting}
                />
                {errors.website && (
                  <p className="text-sm text-accent mt-1">{errors.website.message}</p>
                )}
              </div>

              <div>
                <Input
                  {...register("name")}
                  placeholder="Your Name *"
                  className="h-12 bg-card text-foreground"
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-sm text-accent mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="Work Email *"
                  className="h-12 bg-card text-foreground"
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-sm text-accent mt-1">{errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full text-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Get Free Audit Report"}
              </Button>

              <p className="text-xs text-primary-foreground/70 text-center">
                No credit card required • Delivered in 48 hours • 100% confidential
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuditForm;

