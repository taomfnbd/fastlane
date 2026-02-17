import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { StatusBadge } from "@/components/shared/status-badge";
import { CommentSection } from "@/components/shared/comment-section";
import { StrategyItemCard } from "@/components/portal/strategy-item-card";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 h-7 text-xs text-muted-foreground">
          <Link href="/portal/strategy">
            <ArrowLeft className="mr-1 h-3 w-3" />
            Strategie
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">{strategy.title}</h1>
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
        <div className="flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-medium">Votre avis est attendu</span> — revisez chaque element et approuvez ou rejetez.
          </p>
        </div>
      )}
      {showGreenBanner && (
        <div className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <p className="text-sm text-emerald-800 dark:text-emerald-300">
            <span className="font-medium">Strategie approuvee</span> — aucune action requise.
          </p>
        </div>
      )}

      {/* Progress */}
      {totalItems > 0 && (
        <div className="h-1.5 w-full rounded-full bg-muted">
          <div
            className="h-1.5 rounded-full bg-emerald-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Strategy Items — Collapsible cards */}
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
            />
          ))}
        </div>
      )}

      {/* Global comments */}
      <div>
        <h2 className="text-sm font-medium mb-3">Commentaires</h2>
        <div className="rounded-md border p-3">
          <CommentSection
            comments={strategy.comments}
            strategyId={strategy.id}
          />
        </div>
      </div>
    </div>
  );
}
