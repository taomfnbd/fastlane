import { requireClient } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { ChatInput } from "@/components/portal/chat-input";

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

  let lastDayKey = "";

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-up">
      {/* Header */}
      <div className="space-y-1 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Contact Support
        </h1>
        <p className="text-sm text-muted-foreground">
          Échangez avec l&apos;équipe Fastlane
        </p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar rounded-xl bg-background border border-primary/5 p-4 lg:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <span className="material-symbols-outlined text-3xl">chat_bubble</span>
            <p className="text-sm font-medium">Aucun message</p>
            <p className="text-xs">
              Envoyez un message pour démarrer la conversation.
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
                  <div className="flex items-center gap-3 my-6">
                    <div className="h-px flex-1 bg-primary/10" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      {formatDaySeparator(msg.date)}
                    </span>
                    <div className="h-px flex-1 bg-primary/10" />
                  </div>
                )}

                {msg.sender === "team" ? (
                  /* Team message — left aligned with avatar */
                  <div className="flex gap-4 items-start">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center border border-primary/30">
                      <span className="text-xs font-bold text-[#6961ff]">FL</span>
                    </div>
                    <div className="flex-1 max-w-[80%]">
                      <div className="bg-card p-4 rounded-xl shadow-sm border border-primary/5">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-[#6961ff] uppercase tracking-wider">
                            Équipe Fastlane
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatTime(msg.date)}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Client message — right aligned */
                  <div className="flex flex-col items-end">
                    <div className="w-11/12 max-w-lg bg-primary/20 p-4 rounded-xl border border-primary/30">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Moi
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatTime(msg.date)}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
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
