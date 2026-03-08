import { requireClient } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { ChatInput } from "@/components/portal/chat-input";
import { MessageSquare } from "lucide-react";

export const metadata = { title: "Contacter le support" };

function formatTime(date: Date): string {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDaySeparator(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (today.getTime() - msgDay.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ContactSupportPage() {
  const session = await requireClient();

  const questions = await prisma.question.findMany({
    where: { targetCompanyId: session.companyId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      answer: true,
      answeredAt: true,
      createdAt: true,
    },
  });

  // Build a flat list of messages for the chat view
  type ChatMessage = {
    id: string;
    sender: "client" | "team";
    content: string;
    date: Date;
  };

  const messages: ChatMessage[] = [];
  for (const q of questions) {
    messages.push({
      id: `${q.id}-q`,
      sender: "client",
      content: q.content,
      date: q.createdAt,
    });
    if (q.answer && q.answeredAt) {
      messages.push({
        id: `${q.id}-a`,
        sender: "team",
        content: q.answer,
        date: q.answeredAt,
      });
    }
  }

  // Group messages by day for separators
  let lastDayKey = "";

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-up">
      {/* Header */}
      <div className="space-y-1 pb-4">
        <h1 className="text-xl font-semibold tracking-tight">
          Contacter le support
        </h1>
        <p className="text-sm text-muted-foreground">
          Echangez avec l&apos;equipe Fastlane
        </p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto rounded-xl border bg-muted/30 p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <MessageSquare className="h-8 w-8" />
            <p className="text-sm font-medium">Aucun message</p>
            <p className="text-xs">
              Envoyez un message pour demarrer la conversation.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const dayKey = msg.date.toDateString();
            const showSeparator = dayKey !== lastDayKey;
            lastDayKey = dayKey;

            return (
              <div key={msg.id}>
                {showSeparator && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {formatDaySeparator(msg.date)}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}

                {msg.sender === "team" ? (
                  <div className="flex flex-col items-start max-w-[80%]">
                    <span className="text-xs font-medium uppercase tracking-wide text-primary mb-1">
                      Equipe Fastlane
                    </span>
                    <div className="rounded-xl bg-card p-4 shadow-sm">
                      <p className="text-sm whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {formatTime(msg.date)}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-end max-w-[80%] ml-auto">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                      Moi
                    </span>
                    <div className="rounded-xl bg-primary/10 p-4">
                      <p className="text-sm whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {formatTime(msg.date)}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <ChatInput />
    </div>
  );
}
