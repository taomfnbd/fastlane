import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ProgressBar } from "@/components/shared/progress-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { EventsFilter } from "@/components/admin/events-filter";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { CreateEventDialog } from "@/components/admin/create-event-dialog";

export const metadata = { title: "Evenements" };

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  await requireAdmin();
  const { page = "1", q, status } = await searchParams;
  const currentPage = Math.max(1, Number(page));
  const perPage = 10;

  const statusFilter = status === "active" ? { status: "ACTIVE" as const }
    : status === "draft" ? { status: "DRAFT" as const }
    : status === "completed" ? { status: { in: ["COMPLETED" as const, "ARCHIVED" as const] } }
    : {};

  const searchFilter = q ? {
    OR: [
      { name: { contains: q, mode: "insensitive" as const } },
      { description: { contains: q, mode: "insensitive" as const } },
    ],
  } : {};

  const where = { ...statusFilter, ...searchFilter };

  const [events, totalCount, activeCount, draftCount, completedCount] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { startDate: "desc" },
      skip: (currentPage - 1) * perPage,
      take: perPage,
      include: {
        companies: {
          include: {
            company: { select: { name: true } },
            strategies: { select: { status: true } },
            deliverables: { select: { status: true } },
          },
        },
      },
    }),
    prisma.event.count({ where }),
    prisma.event.count({ where: { status: "ACTIVE" } }),
    prisma.event.count({ where: { status: "DRAFT" } }),
    prisma.event.count({ where: { status: { in: ["COMPLETED", "ARCHIVED"] } } }),
  ]);

  const allCount = activeCount + draftCount + completedCount;

  return (
    <div className="space-y-4">
      <PageHeader title="Evenements" action={<CreateEventDialog />} />
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <EventsFilter counts={{ active: activeCount, draft: draftCount, completed: completedCount, all: allCount }} />
        <div className="sm:ml-auto w-full sm:w-64">
          <SearchInput basePath="/admin/events" placeholder="Rechercher un evenement..." />
        </div>
      </div>
      {events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Aucun evenement"
          description={status ? "Aucun evenement avec ce statut." : "Creez votre premier evenement."}
          action={!status ? <CreateEventDialog /> : undefined}
        />
      ) : (
        <div className="space-y-2">
          {events.map((event) => {
            const totalItems = event.companies.reduce(
              (sum, ec) => sum + ec.strategies.length + ec.deliverables.length,
              0
            );
            const approvedItems = event.companies.reduce(
              (sum, ec) =>
                sum +
                ec.strategies.filter((s) => s.status === "APPROVED").length +
                ec.deliverables.filter(
                  (d) => d.status === "APPROVED" || d.status === "DELIVERED"
                ).length,
              0
            );
            const pct =
              totalItems > 0
                ? Math.round((approvedItems / totalItems) * 100)
                : 0;

            return (
              <Link
                key={event.id}
                href={`/admin/events/${event.id}`}
                className="flex items-center gap-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {event.name}
                    </p>
                    <StatusBadge status={event.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.startDate).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    &mdash;{" "}
                    {new Date(event.endDate).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {" \u00B7 "}
                    {event.companies.length} entreprise
                    {event.companies.length !== 1 ? "s" : ""}
                  </p>
                  {totalItems > 0 && (
                    <div className="flex items-center gap-2 max-w-xs">
                      <ProgressBar value={pct} className="flex-1" />
                      <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                        {pct}%
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <Pagination total={totalCount} perPage={perPage} basePath="/admin/events" />
    </div>
  );
}
