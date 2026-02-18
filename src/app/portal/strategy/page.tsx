import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { EMPTY_STATES } from "@/lib/portal-constants";
import { Target, MessageSquare, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata = { title: "Strategie" };

export default async function PortalStrategyPage() {
  const session = await requireClient();

  const strategies = await prisma.strategy.findMany({
    where: {
      eventCompany: { companyId: session.companyId },
      status: { not: "DRAFT" },
    },
    include: {
      eventCompany: {
        include: { event: { select: { name: true } } },
      },
      items: { select: { id: true, status: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const needsReview = (status: string) =>
    status === "PENDING_REVIEW" || status === "REVISED";

  // Sort: pending first, then approved
  const sortedStrategies = [...strategies].sort((a, b) => {
    const priority: Record<string, number> = { PENDING_REVIEW: 0, REVISED: 0, CHANGES_REQUESTED: 1, APPROVED: 2 };
    return (priority[a.status] ?? 1) - (priority[b.status] ?? 1);
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">Strategie</h1>
        <p className="text-sm text-muted-foreground">Consultez et validez les strategies proposees par l&apos;equipe</p>
      </div>

      {strategies.length === 0 ? (
        <EmptyState
          icon={Target}
          title={EMPTY_STATES.strategies.title}
          description={EMPTY_STATES.strategies.description}
        />
      ) : (
        <div className="space-y-2">
          {sortedStrategies.map((strategy) => {
            const approvedItems = strategy.items.filter((i) => i.status === "APPROVED").length;
            const totalItems = strategy.items.length;
            const pct = totalItems > 0 ? Math.round((approvedItems / totalItems) * 100) : 0;
            const isPending = needsReview(strategy.status);
            const isApproved = strategy.status === "APPROVED";

            return (
              <Link
                key={strategy.id}
                href={`/portal/strategy/${strategy.id}`}
                className={cn(
                  "group flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent",
                  isPending && "ring-1 ring-amber-500/20",
                  isApproved && "opacity-50",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate group-hover:underline">{strategy.title}</p>
                    {isPending && (
                      <span className="shrink-0 inline-flex items-center gap-1.5 text-xs text-amber-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        A valider
                      </span>
                    )}
                    <StatusBadge status={strategy.status} className="shrink-0 ml-auto" />
                  </div>
                  {strategy.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{strategy.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                    <span>{strategy.eventCompany.event.name}</span>
                    <span>v{strategy.version}</span>
                    {totalItems > 0 && (
                      <>
                        <span>{approvedItems}/{totalItems}</span>
                        <div className="flex-1 max-w-24">
                          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-1 rounded-full bg-emerald-500 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </>
                    )}
                    {strategy._count.comments > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {strategy._count.comments}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
