"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Loader2, Bot, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";

const translations = {
  en: {
    title: "Chat with Document",
    placeholder: "Ask something about the document (e.g., When is the trial date?)",
    send: "Send",
    you: "You",
    assistant: "AI Assistant",
    noMessages: "Start a conversation by asking a question about the document.",
    notInDocument: "This information is not available in the document.",
  },
  el: {
    title: "Συνομιλία με το Έγγραφο",
    placeholder: "Ρωτήστε κάτι για το έγγραφο (π.χ. Πότε είναι η δικάσιμος;)",
    send: "Αποστολή",
    you: "Εσείς",
    assistant: "AI Βοηθός",
    noMessages: "Ξεκινήστε μια συνομιλία κάνοντας μια ερώτηση σχετικά με το έγγραφο.",
    notInDocument: "Αυτή η πληροφορία δεν είναι διαθέσιμη στο έγγραφο.",
  },
};

interface DocumentChatProps {
  documentId: string;
  documentName?: string;
  locale?: Locale;
}

export function DocumentChat({
  documentId,
  documentName,
  locale = "el",
}: DocumentChatProps) {
  const t = translations[locale];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { documentId },
    }),
  });

  const isLoading = status === "streaming";

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Card className="flex flex-col h-[600px] w-full">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          {t.title}
        </CardTitle>
        {documentName && (
          <p className="text-sm text-muted-foreground font-normal">
            {documentName}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center text-muted-foreground">
              <div>
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t.noMessages}</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted border"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold opacity-70">
                      {message.role === "user" ? t.you : t.assistant}
                    </span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">
                    {message.parts.map((part, i) => {
                      if (part.type === "text") {
                        return <span key={i}>{part.text}</span>;
                      }
                      return null;
                    })}
                  </div>
                </div>

                {message.role === "user" && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="max-w-[80%] rounded-lg px-4 py-3 bg-muted border">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    {locale === "el" ? "Γράφει..." : "Typing..."}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim() && !isLoading) {
              sendMessage({ text: input });
              setInput("");
            }
          }}
          className="p-4 border-t bg-background"
        >
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}