"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, MessageCircleQuestion, CheckCircle2 } from "lucide-react";
import { createQuestion } from "@/server/actions/questions";
import { answerQuestion } from "@/server/actions/questions";
import { relativeTime } from "@/lib/utils";

interface Question {
  id: string;
  content: string;
  answer: string | null;
  answeredAt: Date | null;
  createdAt: Date;
  author: { name: string };
}

interface QuestionSectionProps {
  questions: Question[];
  isAdmin: boolean;
  targetCompanyId?: string;
  strategyId?: string;
  strategyItemId?: string;
  deliverableId?: string;
}

export function QuestionSection({
  questions,
  isAdmin,
  targetCompanyId,
  strategyId,
  strategyItemId,
  deliverableId,
}: QuestionSectionProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");

  async function handleAskQuestion() {
    if (!content.trim() || !targetCompanyId) return;
    setLoading(true);

    const formData = new FormData();
    formData.set("content", content);
    formData.set("targetCompanyId", targetCompanyId);
    if (strategyId) formData.set("strategyId", strategyId);
    if (strategyItemId) formData.set("strategyItemId", strategyItemId);
    if (deliverableId) formData.set("deliverableId", deliverableId);

    const result = await createQuestion(formData);
    if (result.success) {
      setContent("");
      toast.success("Question envoyee");
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  async function handleAnswer(questionId: string) {
    if (!answerText.trim()) return;
    setLoading(true);

    const formData = new FormData();
    formData.set("id", questionId);
    formData.set("answer", answerText);

    const result = await answerQuestion(formData);
    if (result.success) {
      setAnsweringId(null);
      setAnswerText("");
      toast.success("Reponse envoyee");
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  const unanswered = questions.filter((q) => !q.answeredAt);
  const answered = questions.filter((q) => q.answeredAt);

  return (
    <div className="space-y-3">
      {unanswered.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-amber-600 uppercase tracking-wide">En attente de reponse ({unanswered.length})</p>
          {unanswered.map((q) => (
            <div key={q.id} className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <MessageCircleQuestion className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{q.author.name}</span>
                    <span className="text-[11px] text-muted-foreground">{relativeTime(q.createdAt)}</span>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{q.content}</p>
                </div>
              </div>
              {!isAdmin && (
                answeringId === q.id ? (
                  <div className="ml-6 space-y-2">
                    <Textarea
                      placeholder="Votre reponse..."
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      rows={2}
                      className="text-xs"
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && answerText.trim()) {
                          e.preventDefault();
                          handleAnswer(q.id);
                        }
                      }}
                    />
                    <div className="flex gap-1">
                      <Button size="sm" className="h-6 text-xs" onClick={() => handleAnswer(q.id)} disabled={loading || !answerText.trim()}>
                        {loading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                        Repondre
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => { setAnsweringId(null); setAnswerText(""); }}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="h-6 text-xs ml-6" onClick={() => setAnsweringId(q.id)}>
                    Repondre
                  </Button>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {answered.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Repondues ({answered.length})</p>
          {answered.map((q) => (
            <div key={q.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{q.author.name}</span>
                    <span className="text-[11px] text-muted-foreground">{relativeTime(q.createdAt)}</span>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{q.content}</p>
                  <div className="mt-2 pl-3 border-l-2 border-emerald-200 dark:border-emerald-800">
                    <p className="text-sm whitespace-pre-wrap">{q.answer}</p>
                    {q.answeredAt && (
                      <p className="text-[11px] text-muted-foreground mt-1">Repondu {relativeTime(q.answeredAt)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin: ask new question */}
      {isAdmin && targetCompanyId && (
        <div className="flex gap-2 pt-1">
          <Textarea
            placeholder="Poser une question au client... (Ctrl+Entree pour envoyer)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && content.trim()) {
                e.preventDefault();
                handleAskQuestion();
              }
            }}
            rows={1}
            className="text-xs min-h-8"
            disabled={loading}
          />
          <Button
            size="sm"
            className="h-8 text-xs shrink-0"
            onClick={handleAskQuestion}
            disabled={loading || !content.trim()}
          >
            {loading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            Poser
          </Button>
        </div>
      )}

      {questions.length === 0 && !isAdmin && (
        <p className="text-xs text-muted-foreground text-center py-2">Aucune question.</p>
      )}
    </div>
  );
}
