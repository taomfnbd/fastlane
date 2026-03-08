"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { postClientQuestion } from "@/server/actions/questions";

export function ChatInput() {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    setError(null);
    startTransition(async () => {
      const result = await postClientQuestion(trimmed);
      if (result.success) {
        setContent("");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="border-t bg-background p-4">
      {error && (
        <p className="text-xs text-destructive mb-2">{error}</p>
      )}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ecrivez votre message..."
          rows={1}
          className="flex-1 resize-none rounded-xl border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          disabled={isPending}
        />
        <Button
          type="submit"
          size="icon"
          disabled={isPending || !content.trim()}
          className="h-10 w-10 shrink-0 rounded-xl"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
