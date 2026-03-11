"use client";

import { useState, useTransition } from "react";
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
    <div className="pt-4 border-t border-primary/10">
      {error && (
        <p className="text-xs text-red-400 mb-2">{error}</p>
      )}
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Écrivez votre message..."
            className="w-full bg-card border-none rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            disabled={isPending}
          />
        </div>
        <button
          type="submit"
          disabled={isPending || !content.trim()}
          className="h-11 w-11 bg-[#6961ff] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#6961ff]/20 hover:scale-105 transition-transform active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shrink-0"
        >
          <span className="material-symbols-outlined text-xl">send</span>
        </button>
      </form>
    </div>
  );
}
