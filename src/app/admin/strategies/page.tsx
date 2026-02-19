import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { ProgressBar } from "@/components/shared/progress-bar";
import { StrategiesFilter } from "@/components/admin/strategies-filter";
import { Target } from "lucide-react";
import { cn, relativeTime } from "@/lib/utils";
import Link from "next/link";

export const metadata = { title: "Strategies" };

export default async function AdminStrategiesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; event?: string; company?: string }>;
}) {
  await requireAdmin();
  const { status = "pending", event, company } = await searchParams;

  const statusFilter =
    status === "pending"
      ? { status: "PENDING_REVIEW" as const }
      : status === "changes"
        ? { status: "CHANGES_REQUESTED" as const }
        : {};

  const relationFilter: Record<string, unknown> = {};
  if (event) relationFilter.eventId = event;
  if (company) relationFilter.companyId = company;

  const ecWhere = Object.keys(relationFilter).length > 0 ? { eventCompany: relationFilter } : {};

  const [strategies, counts, events, companies] = await Promise.all([
    prisma.strategy.findMany({
      where: { ...statusFilter, ...ecWhere },
      orderBy: { updatedAt: "desc" },
      include: {
        items: { select: { status: true } },
        eventCompany: {
          include: {
            company: { select: { id: true, name: true } },
            event: { select: { id: true, name: true } },
          },
        },
      },
    }),
    Promise.all([
      prisma.strategy.count({ where: { status: "PENDING_REVIEW", ...ecWhere } }),
      prisma.strategy.count({ where: { status: "CHANGES_REQUESTED", ...ecWhere } }),
      prisma.strategy.count({ where: ecWhere }),
    ]),
    prisma.event.findMany({ select: { id: true, name: true }, orderBy: { startDate: "desc" } }),
    prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const [pendingCount, changesCount, allCount] = counts;

  return (
    <div className="space-y-4">
      <PageHeader title="Strategies" />
      <StrategiesFilter
        events={events}
        companies={companies}
        counts={{ pending: pendingCount, changes: changesCount, all: allCount }}
      />
      {strategies.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Aucune strategie"
          description={status === "all" ? "Aucune strategie creee." : "Aucune strategie avec ce statut."}
        />
      ) : (
        <div className="space-y-3">
          {strategies.map((strategy) => {
            const approvedItems = strategy.items.filter((i) => i.status === "APPROVED").length;
            const totalItems = strategy.items.length;
            const pct = totalItems > 0 ? Math.round((approvedItems / totalItems) * 100) : 0;
            return (
              <Link
                key={strategy.id}
                href={`/admin/events/${strategy.eventCompany.event.id}/strategy?company=${strategy.eventCompany.company.id}`}
                className="flex items-center gap-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{strategy.title}</p>
                    <StatusBadge status={strategy.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {strategy.eventCompany.company.name} · {strategy.eventCompany.event.name}
                  </p>
                  {totalItems > 0 && (
                    <div className="flex items-center gap-3 max-w-xs">
                      <ProgressBar value={pct} className="flex-1" />
                      <span
                        className={cn(
                          "text-[11px] font-medium tabular-nums",
                          pct >= 70 ? "text-emerald-600" : pct >= 40 ? "text-amber-600" : "text-red-600"
                        )}
                      >
                        {approvedItems}/{totalItems}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground/60 shrink-0">
                  {relativeTime(strategy.updatedAt)}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
