"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Linkedin, Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactFormSchema, type ContactFormData } from "@/lib/validations";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to submit message");
      }

      toast({
        title: "Message Sent!",
        description: "Thank you for reaching out. I'll respond within 24 hours.",
      });

      reset();
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <section id="contact" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Let's Work Together</h2>
            <p className="text-xl text-muted-foreground">
              Ready to transform your legal operations? Get in touch to discuss your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Input {...register("name")} placeholder="Your Name *" className="h-12" disabled={isSubmitting} />
                  {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <Input
                    {...register("email")}
                    type="email"
                    placeholder="Email Address *"
                    className="h-12"
                    disabled={isSubmitting}
                  />
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <Input
                    {...register("company")}
                    placeholder="Company (Optional)"
                    className="h-12"
                    disabled={isSubmitting}
                  />
                  {errors.company && <p className="text-sm text-destructive mt-1">{errors.company.message}</p>}
                </div>

                <div>
                  <Textarea
                    {...register("message")}
                    placeholder="Tell me about your project or challenge... *"
                    className="min-h-[150px]"
                    disabled={isSubmitting}
                  />
                  {errors.message && <p className="text-sm text-destructive mt-1">{errors.message.message}</p>}
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-semibold text-foreground mb-6">Connect With Me</h3>
                <div className="space-y-4">
                  <a
                    href="mailto:info@ampassador.com"
                    className="flex items-center gap-4 text-muted-foreground hover:text-accent transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-accent/10 group-hover:bg-accent group-hover:text-accent-foreground transition-colors flex items-center justify-center">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Email</p>
                      <p>info@ampassador.com</p>
                    </div>
                  </a>

                  <a
                    href="tel:+306978100951"
                    className="flex items-center gap-4 text-muted-foreground hover:text-accent transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-accent/10 group-hover:bg-accent group-hover:text-accent-foreground transition-colors flex items-center justify-center">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Phone</p>
                      <p>+30 697 810 0951</p>
                    </div>
                  </a>

                  <a
                    href="https://www.linkedin.com/company/ampassador/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 text-muted-foreground hover:text-accent transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-accent/10 group-hover:bg-accent group-hover:text-accent-foreground transition-colors flex items-center justify-center">
                      <Linkedin className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">LinkedIn</p>
                      <p>Connect professionally</p>
                    </div>
                  </a>
                </div>
              </div>

              <div className="p-6 rounded-lg bg-card border border-border">
                <h4 className="font-semibold text-foreground mb-2">Response Time</h4>
                <p className="text-muted-foreground">
                  I typically respond to inquiries within 24 hours during business days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;

