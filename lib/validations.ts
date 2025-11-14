import { z } from "zod";

export const emailCaptureSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type EmailCaptureData = z.infer<typeof emailCaptureSchema>;

export const consultationFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  company: z.string().min(2, "Company name must be at least 2 characters"),
  phone: z.string().optional(),
});

export type ConsultationFormData = z.infer<typeof consultationFormSchema>;

export const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  company: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

export const auditFormSchema = z.object({
  website: z.string().url("Please enter a valid website URL"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
});

export type AuditFormData = z.infer<typeof auditFormSchema>;

