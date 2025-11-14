"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { emailCaptureSchema, type EmailCaptureData } from "@/lib/validations";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";

const NewsletterCTA = () => {
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EmailCaptureData>({
    resolver: zodResolver(emailCaptureSchema),
  });

  const onSubmit = async (data: EmailCaptureData) => {
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Handle duplicate email error gracefully
        if (result.error === "DUPLICATE_EMAIL" || response.status === 409) {
          toast({
            title: "Already Subscribed",
            description: "This email is already on our newsletter list.",
          });
          reset();
          return;
        }
        throw new Error(result.error || "Failed to subscribe");
      }

      toast({
        title: "Successfully Subscribed!",
        description: "You'll receive weekly insights on legal technology and operations.",
      });

      reset();
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-primary via-primary/90 to-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent text-accent-foreground mb-6">
            <Mail className="h-8 w-8" />
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Stay Ahead of the Curve
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Get weekly insights on legal technology trends, best practices, and industry innovations
          </p>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto"
          >
            <div className="flex-1">
              <Input
                {...register("email")}
                type="email"
                placeholder="Enter your email address"
                className="h-14 bg-card text-foreground text-lg"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-accent mt-1 text-left">{errors.email.message}</p>
              )}
            </div>
            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="h-14 px-8 text-lg whitespace-nowrap"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Subscribing..." : "Subscribe"}
            </Button>
          </form>
          <p className="text-sm text-primary-foreground/70 mt-4">
            Join 2,500+ legal professionals • Unsubscribe anytime • No spam, ever
          </p>
        </div>
      </div>
    </section>
  );
};

export default NewsletterCTA;

