import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Target } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Strategy" };

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
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Strategy" />

      {strategies.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No strategies yet"
          description="Strategies will appear here once the team shares them."
        />
      ) : (
        <div className="rounded-md border divide-y">
          {strategies.map((strategy) => {
            const approvedItems = strategy.items.filter((i) => i.status === "APPROVED").length;
            const totalItems = strategy.items.length;
            const pct = totalItems > 0 ? Math.round((approvedItems / totalItems) * 100) : 0;

            return (
              <Link
                key={strategy.id}
                href={`/portal/strategy/${strategy.id}`}
                className="block px-3 py-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{strategy.title}</p>
                    {strategy.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{strategy.description}</p>
                    )}
                  </div>
                  <StatusBadge status={strategy.status} className="shrink-0 ml-3" />
                </div>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                  <span>{strategy.eventCompany.event.name}</span>
                  <span>v{strategy.version}</span>
                  {totalItems > 0 && (
                    <>
                      <span>{approvedItems}/{totalItems} items</span>
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
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
