/**
 * Chat Utilities
 * Helper functions for message parsing and context management
 */

import type { UIMessage } from "ai";

/**
 * Extracts text content from UIMessage
 * Handles both string content and parts array formats
 */
export function extractMessageContent(message: UIMessage | undefined): string {
  if (!message) return "";

  // Handle parts array (primary format in AI SDK)
  if (Array.isArray((message as any).parts)) {
    return (message as any).parts
      .filter((p: any) => p.type === "text" && p.text)
      .map((p: any) => p.text)
      .join(" ");
  }

  // Handle string content (fallback)
  if (typeof (message as any).content === "string") {
    return (message as any).content;
  }

  return "";
}

/**
 * Truncates context to fit within token limits
 * Approximate: 1 token ≈ 4 characters for Greek text
 */
export function truncateContext(
  context: string,
  maxChars: number = 100000 // ~25k tokens
): { truncated: string; wasTruncated: boolean } {
  if (context.length <= maxChars) {
    return { truncated: context, wasTruncated: false };
  }

  // Try to truncate at sentence boundary
  const truncated = context.substring(0, maxChars);
  const lastPeriod = truncated.lastIndexOf(".");
  const lastNewline = truncated.lastIndexOf("\n");

  const cutPoint = Math.max(lastPeriod, lastNewline, maxChars - 1000);

  return {
    truncated:
      context.substring(0, cutPoint) +
      "\n\n[... περιεχόμενο περικοπή λόγω μεγέθους εγγράφου ...]",
    wasTruncated: true,
  };
}

/**
 * Builds document context from AI analysis
 */
export function buildAnalysisContext(aiAnalysis: any): string {
  if (!aiAnalysis || typeof aiAnalysis !== "object") {
    return "";
  }

  let context = "";

  if (aiAnalysis.summary) {
    context += `Περίληψη εγγράφου: ${aiAnalysis.summary}\n\n`;
  }

  if (aiAnalysis.deadlines && Array.isArray(aiAnalysis.deadlines)) {
    context += `Προθεσμίες:\n`;
    aiAnalysis.deadlines.forEach((d: any) => {
      context += `- ${d.date}: ${d.description}\n`;
    });
    context += `\n`;
  }

  if (aiAnalysis.parties) {
    context += `Μέρη:\n`;
    if (aiAnalysis.parties.plaintiff) {
      context += `- Ενάγων/Αιτών: ${aiAnalysis.parties.plaintiff}\n`;
    }
    if (aiAnalysis.parties.defendant) {
      context += `- Εναγόμενος/Καθ' ου: ${aiAnalysis.parties.defendant}\n`;
    }
    if (aiAnalysis.parties.others && Array.isArray(aiAnalysis.parties.others)) {
      aiAnalysis.parties.others.forEach((p: string) => {
        context += `- ${p}\n`;
      });
    }
    context += `\n`;
  }

  if (aiAnalysis.keyPoints && Array.isArray(aiAnalysis.keyPoints)) {
    context += `Βασικά σημεία:\n`;
    aiAnalysis.keyPoints.forEach((point: string) => {
      context += `- ${point}\n`;
    });
    context += `\n`;
  }

  return context;
}

