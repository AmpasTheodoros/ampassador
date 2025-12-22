"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type Locale = "en" | "el";

const translations = {
  en: {
    title: "Contact the Law Firm",
    subtitle: "Fill out the form below and we'll get back to you as soon as possible",
    name: "Full Name",
    email: "Email Address",
    phone: "Phone Number (Optional)",
    description: "Describe your legal issue in a few words...",
    submit: "Submit Request",
    submitting: "Submitting...",
    successTitle: "Thank You!",
    successMessage: "Your request has been received. The law firm will contact you soon.",
    errorTitle: "Error",
    errorMessage: "Something went wrong. Please try again.",
    required: "This field is required",
    invalidEmail: "Please enter a valid email address",
    descriptionMin: "Please provide at least 10 characters",
  },
  el: {
    title: "Επικοινωνία με το Νομικό Γραφείο",
    subtitle: "Συμπληρώστε την παρακάτω φόρμα και θα επικοινωνήσουμε μαζί σας το συντομότερο δυνατό",
    name: "Ονοματεπώνυμο",
    email: "Διεύθυνση Email",
    phone: "Αριθμός Τηλεφώνου (Προαιρετικό)",
    description: "Περιγράψτε την υπόθεσή σας με λίγα λόγια...",
    submit: "Αποστολή Αιτήματος",
    submitting: "Αποστολή...",
    successTitle: "Ευχαριστούμε!",
    successMessage: "Το αίτημά σας έχει ληφθεί. Το νομικό γραφείο θα επικοινωνήσει μαζί σας σύντομα.",
    errorTitle: "Σφάλμα",
    errorMessage: "Κάτι πήγε στραβά. Παρακαλώ δοκιμάστε ξανά.",
    required: "Αυτό το πεδίο είναι υποχρεωτικό",
    invalidEmail: "Παρακαλώ εισάγετε μια έγκυρη διεύθυνση email",
    descriptionMin: "Παρακαλώ δώστε τουλάχιστον 10 χαρακτήρες",
  },
};

function detectLocale(): Locale {
  if (typeof window === "undefined") return "el";
  
  // Check URL query parameter for locale (e.g., ?lang=en or ?lang=el)
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get("lang");
  if (urlLang === "en" || urlLang === "el") {
    return urlLang as Locale;
  }
  
  // Check URL path for locale (e.g., /en/public/intake/... or /el/public/intake/...)
  const pathname = window.location.pathname;
  if (pathname.startsWith("/en/")) return "en";
  if (pathname.startsWith("/el/")) return "el";
  
  // Check browser language
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("en")) return "en";
  if (browserLang.startsWith("el")) return "el";
  
  // Default to Greek
  return "el";
}

export default function PublicIntake() {
  const params = useParams();
  const orgId = params?.orgId as string;
  
  const [locale, setLocale] = useState<Locale>("el");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocale(detectLocale());
  }, []);

  const t = translations[locale];

  function validateForm(formData: FormData): boolean {
    const errors: Record<string, string> = {};
    
    const name = formData.get("name")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const description = formData.get("description")?.toString().trim();

    if (!name || name.length < 2) {
      errors.name = t.required;
    }

    if (!email) {
      errors.email = t.required;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = t.invalidEmail;
    }

    if (!description || description.length < 10) {
      errors.description = t.descriptionMin;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFormErrors({});

    if (!orgId) {
      setError(locale === "el" 
        ? "Το ID του οργανισμού δεν βρέθηκε. Παρακαλώ ελέγξτε το URL."
        : "Organization ID not found. Please check the URL.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    
    if (!validateForm(formData)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const requestBody = {
        name: formData.get("name")?.toString().trim(),
        email: formData.get("email")?.toString().trim(),
        phone: formData.get("phone")?.toString().trim() || undefined,
        description: formData.get("description")?.toString().trim(),
        clerkOrgId: orgId,
        source: "Public Intake Form",
      };

      // Validate required fields
      if (!requestBody.name || !requestBody.email || !requestBody.description) {
        setError(t.required);
        setIsSubmitting(false);
        return;
      }

      const res = await fetch("/api/leads/intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle validation errors
        if (data.details && Array.isArray(data.details)) {
          const validationErrors: Record<string, string> = {};
          data.details.forEach((detail: any) => {
            if (detail.path && detail.path.length > 0) {
              validationErrors[detail.path[0]] = detail.message || t.errorMessage;
            }
          });
          setFormErrors(validationErrors);
          setError(data.error || t.errorMessage);
        } else {
          throw new Error(data.error || data.message || t.errorMessage);
        }
        return;
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Form submission error:", err);
      setError(err instanceof Error ? err.message : t.errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="pt-6 pb-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-4">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">{t.successTitle}</h2>
                <p className="text-muted-foreground">{t.successMessage}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4 py-12">
      <Card className="max-w-lg w-full shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">{t.title}</CardTitle>
          <CardDescription>{t.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">{t.errorTitle}</p>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                {t.name} <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                name="name"
                placeholder={t.name}
                required
                disabled={isSubmitting}
                className={formErrors.name ? "border-destructive" : ""}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                {t.email} <span className="text-destructive">*</span>
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t.email}
                required
                disabled={isSubmitting}
                className={formErrors.email ? "border-destructive" : ""}
              />
              {formErrors.email && (
                <p className="text-sm text-destructive">{formErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                {t.phone}
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder={t.phone}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                {t.description} <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="description"
                name="description"
                placeholder={t.description}
                required
                rows={5}
                disabled={isSubmitting}
                className={formErrors.description ? "border-destructive" : ""}
              />
              {formErrors.description && (
                <p className="text-sm text-destructive">{formErrors.description}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t.submitting}
                </>
              ) : (
                t.submit
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

