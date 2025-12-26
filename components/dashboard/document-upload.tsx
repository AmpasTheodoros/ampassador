"use client";

import { useState } from "react";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";

interface DocumentUploadProps {
  matterId?: string;
  locale?: Locale;
  onUploadComplete?: () => void;
}

const translations = {
  en: {
    title: "Upload Document",
    description: "PDF, DOCX, TXT (max 16MB)",
    uploading: "Uploading...",
    processing: "Processing...",
    success: "Upload successful!",
    error: "Upload failed. Please try again.",
    uploadButton: "Choose File",
    retry: "Retry",
    fileTypes: "PDF, DOCX, TXT (max 16MB)",
    dragDrop: "or drag and drop",
  },
  el: {
    title: "Ανέβασμα Εγγράφου",
    description: "PDF, DOCX, TXT (μέγιστο 16MB)",
    uploading: "Ανέβασμα...",
    processing: "Επεξεργασία...",
    success: "Επιτυχές ανέβασμα!",
    error: "Αποτυχία. Παρακαλώ δοκιμάστε ξανά.",
    uploadButton: "Επιλογή Αρχείου",
    retry: "Επανάληψη",
    fileTypes: "PDF, DOCX, TXT (μέγιστο 16MB)",
    dragDrop: "ή σύρετε και αποθέστε",
  },
};

export function DocumentUpload({
  matterId,
  locale = "el",
  onUploadComplete,
}: DocumentUploadProps) {
  const t = translations[locale];
  const router = useRouter();

  const [status, setStatus] = useState<
    "idle" | "uploading" | "processing" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUploadComplete = async (res: any) => {
    if (!res || !res[0]) {
      setStatus("error");
      setErrorMessage(t.error);
      return;
    }

    const file = res[0];
    setStatus("processing");

    try {
      const parseResponse = await fetch("/api/documents/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: file.url,
          fileName: file.name,
          matterId: matterId || undefined,
          fileSize: file.size,
          fileType: file.type || "application/pdf",
        }),
      });

      if (!parseResponse.ok) {
        const errorData = await parseResponse.json();
        throw new Error(errorData.error || t.error);
      }

      setStatus("success");

      if (onUploadComplete) onUploadComplete();
      else router.refresh();

      setTimeout(() => {
        setStatus("idle");
        setErrorMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error processing document:", error);
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : t.error);
    }
  };

  const handleUploadError = (error: Error) => {
    console.error("Upload error:", error);
    setStatus("error");
    setErrorMessage(error.message || t.error);
  };

  return (
    <Card className="w-full overflow-hidden border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/40 transition-colors">
      <CardContent className="p-4 sm:p-5">
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center space-y-1.5">
            <div className="mx-auto inline-flex items-center justify-center size-10 sm:size-11 rounded-full bg-primary/10">
              <FileText className="size-5 text-primary" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground leading-tight">
              {t.title}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t.description}
            </p>
          </div>

          {/* Upload Area */}
          {status === "idle" && (
            <div className="space-y-2">
              <div className="w-full rounded-lg bg-muted/30 border border-dashed border-muted-foreground/30 hover:bg-muted/50 transition-colors">
                <div className="p-4 sm:p-6">
                  <div className="upload-button-wrapper w-full">
                    <UploadButton<OurFileRouter, "documentUploader">
                      endpoint="documentUploader"
                      onClientUploadComplete={handleUploadComplete}
                      onUploadError={handleUploadError}
                      onUploadBegin={() => setStatus("uploading")}
                      content={{
                        button: () => (
                          <span className="inline-flex items-center justify-center gap-2 w-full">
                            <Upload className="size-4 flex-shrink-0" />
                            <span className="truncate">{t.uploadButton}</span>
                          </span>
                        ),
                        allowedContent: "",
                      }}
                    />
                  </div>

                  <p className="mt-3 text-[11px] sm:text-xs text-muted-foreground text-center">
                    {t.dragDrop}
                  </p>

                  {/* Optional: show file types on mobile where it helps */}
                  <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground text-center">
                    {t.fileTypes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {status === "uploading" && (
            <div className="flex flex-col items-center justify-center py-5 space-y-2">
              <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="size-5 text-primary animate-spin" />
              </div>
              <p className="text-sm font-medium text-foreground">{t.uploading}</p>
            </div>
          )}

          {status === "processing" && (
            <div className="flex flex-col items-center justify-center py-5 space-y-2">
              <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="size-5 text-primary animate-pulse" />
              </div>
              <p className="text-sm font-medium text-foreground">{t.processing}</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center justify-center py-5 space-y-2">
              <div className="size-11 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                {t.success}
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-3">
              <div className="flex flex-col items-center justify-center py-5 space-y-2">
                <div className="size-11 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="size-5 text-destructive" />
                </div>

                <div className="text-center px-2">
                  <p className="text-sm font-medium text-destructive">
                    {t.error}
                  </p>

                  {errorMessage && (
                    <p className="mt-1 text-xs text-muted-foreground break-words max-w-[28rem] mx-auto">
                      {errorMessage}
                    </p>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatus("idle");
                  setErrorMessage(null);
                }}
                className="w-full sm:w-auto sm:mx-auto gap-2"
              >
                <Upload className="size-4" />
                {t.retry}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
