import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ProgressBar } from "@/components/shared/progress-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { CreateEventDialog } from "@/components/admin/create-event-dialog";

export const metadata = { title: "Evenements" };

export default async function EventsPage() {
  await requireAdmin();
  const events = await prisma.event.findMany({
    orderBy: { startDate: "desc" },
    include: {
      companies: {
        include: {
          company: { select: { name: true } },
          strategies: { select: { status: true } },
          deliverables: { select: { status: true } },
        },
      },
    },
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Evenements" action={<CreateEventDialog />} />
      {events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Aucun evenement"
          description="Creez votre premier evenement."
          action={<CreateEventDialog />}
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
    </div>
  );
}
