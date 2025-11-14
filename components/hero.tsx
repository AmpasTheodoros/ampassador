"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { consultationFormSchema, type ConsultationFormData } from "@/lib/validations";
import { useToast } from "@/hooks/use-toast";

const Hero = () => {
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationFormSchema),
  });

  const onSubmit = async (data: ConsultationFormData) => {
    try {
      const response = await fetch("/api/consultation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to submit request");
      }

      toast({
        title: "Request Received!",
        description: "I'll get back to you within 24 hours to schedule your consultation.",
      });

      reset();
    } catch (error) {
      console.error("Error submitting consultation request:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-primary">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80 opacity-90" />
        {/* Note: Add your hero-legaltech.jpg image to public/assets/ or update the path */}
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10" />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
              Transforming Legal Operations Through Technology
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8">
              Expert in LegalTech solutions, process optimization, and digital transformation for modern legal teams
            </p>
            <div className="flex flex-wrap gap-4 text-primary-foreground/80">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span>50+ Projects</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span>$10M+ Saved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span>Expert Certified</span>
              </div>
            </div>
          </div>

          {/* Right Column - Lead Form */}
          <Card className="p-8 bg-card border-none shadow-2xl">
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Schedule Your Free Consultation
            </h3>
            <p className="text-muted-foreground mb-6">
              Let's discuss how technology can transform your legal operations
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Input
                  {...register("name")}
                  placeholder="Your Name *"
                  className="h-12"
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                )}
              </div>
              <div>
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="Work Email *"
                  className="h-12"
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>
              <div>
                <Input
                  {...register("company")}
                  placeholder="Company/Organization *"
                  className="h-12"
                  disabled={isSubmitting}
                />
                {errors.company && (
                  <p className="text-sm text-destructive mt-1">{errors.company.message}</p>
                )}
              </div>
              <div>
                <Input
                  {...register("phone")}
                  type="tel"
                  placeholder="Phone Number (Optional)"
                  className="h-12"
                  disabled={isSubmitting}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                )}
              </div>
              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full text-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Book Free Consultation"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Free consultation • No commitment • 24h response time
              </p>
            </form>
          </Card>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;

