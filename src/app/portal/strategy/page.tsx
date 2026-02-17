import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { EMPTY_STATES } from "@/lib/portal-constants";
import { Target, MessageSquare } from "lucide-react";
import Link from "next/link";

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

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Strategie</h1>

      {strategies.length === 0 ? (
        <EmptyState
          icon={Target}
          title={EMPTY_STATES.strategies.title}
          description={EMPTY_STATES.strategies.description}
        />
      ) : (
        <div className="rounded-md border divide-y">
          {strategies.map((strategy) => {
            const approvedItems = strategy.items.filter((i) => i.status === "APPROVED").length;
            const totalItems = strategy.items.length;
            const pct = totalItems > 0 ? Math.round((approvedItems / totalItems) * 100) : 0;
            const showReviewBadge = needsReview(strategy.status);

            return (
              <Link
                key={strategy.id}
                href={`/portal/strategy/${strategy.id}`}
                className="block px-3 py-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{strategy.title}</p>
                    {showReviewBadge && (
                      <span className="shrink-0 inline-flex items-center rounded-full bg-red-100 dark:bg-red-950 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:text-red-400">
                        A reviser
                      </span>
                    )}
                  </div>
                  <StatusBadge status={strategy.status} className="shrink-0 ml-3" />
                </div>
                {strategy.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{strategy.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                  <span>{strategy.eventCompany.event.name}</span>
                  <span>v{strategy.version}</span>
                  {totalItems > 0 && (
                    <>
                      <span>{approvedItems}/{totalItems} elements</span>
                      <div className="flex-1 max-w-24">
                        <div className="h-1 w-full rounded-full bg-muted">
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
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
