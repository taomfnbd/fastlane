import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { StatusBadge } from "@/components/shared/status-badge";
import { CommentSection } from "@/components/shared/comment-section";
import { QuestionSection } from "@/components/shared/question-section";
import { StrategyItemCard } from "@/components/portal/strategy-item-card";
import { ArrowLeft, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ strategyId: string }> }) {
  const { strategyId } = await params;
  const strategy = await prisma.strategy.findUnique({
    where: { id: strategyId },
    select: { title: true },
  });
  return { title: strategy?.title ?? "Strategie" };
}

export default async function StrategyDetailPage({
  params,
}: {
  params: Promise<{ strategyId: string }>;
}) {
  const session = await requireClient();
  const { strategyId } = await params;

  const strategy = await prisma.strategy.findUnique({
    where: { id: strategyId },
    include: {
      eventCompany: {
        include: {
          event: { select: { name: true } },
          company: { select: { id: true } },
        },
      },
      items: {
        orderBy: { order: "asc" },
        include: {
          _count: { select: { comments: true } },
          comments: {
            include: {
              author: { select: { name: true, image: true } },
              replies: {
                include: { author: { select: { name: true, image: true } } },
                orderBy: { createdAt: "asc" },
              },
            },
            where: { parentId: null },
            orderBy: { createdAt: "asc" },
          },
          questions: {
            include: { author: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      },
      comments: {
        include: {
          author: { select: { name: true, image: true } },
          replies: {
            include: { author: { select: { name: true, image: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        where: { parentId: null, strategyItemId: null },
        orderBy: { createdAt: "asc" },
      },
      questions: {
        where: { strategyItemId: null },
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!strategy) notFound();
  if (strategy.eventCompany.company.id !== session.companyId) notFound();

  const approvedItems = strategy.items.filter((i) => i.status === "APPROVED").length;
  const totalItems = strategy.items.length;
  const pct = totalItems > 0 ? Math.round((approvedItems / totalItems) * 100) : 0;

  const showAmberBanner = strategy.status === "PENDING_REVIEW" || strategy.status === "REVISED";
  const showGreenBanner = strategy.status === "APPROVED";

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <Link href="/portal/strategy" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-3.5 w-3.5" />
          Strategies
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">{strategy.title}</h1>
        {strategy.description && (
          <p className="text-sm text-muted-foreground mt-0.5">{strategy.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
          <StatusBadge status={strategy.status} />
          <span>{strategy.eventCompany.event.name}</span>
          {totalItems > 0 && (
            <span>{approvedItems} sur {totalItems} valides</span>
          )}
        </div>
      </div>

      {/* Contextual banner */}
      {showAmberBanner && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-medium">Votre avis est attendu</span> — revisez chaque element et approuvez ou rejetez.
          </p>
        </div>
      )}
      {showGreenBanner && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <p className="text-sm text-emerald-800 dark:text-emerald-300">
            <span className="font-medium">Strategie approuvee</span> — aucune action requise.
          </p>
        </div>
      )}

      {/* Progress */}
      {totalItems > 0 && (
        <div className="h-1 w-full rounded-full bg-muted">
          <div
            className="h-1 rounded-full bg-emerald-500 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Strategy Items */}
      {strategy.items.length === 0 ? (
        <p className="text-xs text-muted-foreground py-8 text-center">Aucun element.</p>
      ) : (
        <div className="space-y-2">
          {strategy.items.map((item, index) => (
            <StrategyItemCard
              key={item.id}
              item={item}
              index={index}
              strategyId={strategy.id}
              strategyStatus={strategy.status}
              currentUserId={session.user.id}
            />
          ))}
        </div>
      )}

      {/* Global comments */}
      <div>
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">Commentaires</h2>
        <div className="rounded-xl border p-3">
          <CommentSection
            comments={strategy.comments}
            currentUserId={session.user.id}
            strategyId={strategy.id}
          />
        </div>
      </div>

      {/* Global questions */}
      <div>
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">Questions</h2>
        <div className="rounded-xl border p-3">
          <QuestionSection
            questions={strategy.questions}
            isAdmin={false}
            strategyId={strategy.id}
          />
        </div>
      </div>
    </div>
  );
}
