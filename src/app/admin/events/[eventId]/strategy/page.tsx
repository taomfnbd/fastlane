import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Target } from "lucide-react";
import Link from "next/link";
import { CreateStrategyDialog } from "@/components/admin/create-strategy-dialog";
import { StrategyListActions } from "@/components/admin/strategy-list-actions";

export const metadata = { title: "Strategies" };

export default async function StrategyListPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ company?: string }>;
}) {
  await requireAdmin();
  const { eventId } = await params;
  const { company: companyFilter } = await searchParams;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      companies: {
        include: {
          company: { select: { id: true, name: true } },
          strategies: {
            include: { items: { select: { status: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
        ...(companyFilter ? { where: { companyId: companyFilter } } : {}),
      },
    },
  });

  if (!event) notFound();

  return (
    <div className="p-3 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{event.name}</p>
          <h2 className="text-sm font-semibold">Strategies</h2>
        </div>
      </div>

      {event.companies.map((ec) => (
        <div key={ec.id} className="space-y-1">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-medium text-muted-foreground">{ec.company.name}</p>
            <CreateStrategyDialog eventCompanyId={ec.id} companyName={ec.company.name} />
          </div>
          {ec.strategies.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 px-1 py-3">Aucune strategie</p>
          ) : (
            ec.strategies.map((strategy) => {
              const approved = strategy.items.filter((i) => i.status === "APPROVED").length;
              const total = strategy.items.length;
              return (
                <div
                  key={strategy.id}
                  className="flex items-center gap-2.5 rounded-md px-2 py-2 hover:bg-accent/50 transition-colors"
                >
                  <Link
                    href={`/admin/events/${eventId}/strategy/${strategy.id}`}
                    className="min-w-0 flex-1"
                  >
                    <p className="text-sm font-medium truncate">{strategy.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {total > 0 ? `${approved}/${total} items` : "0 items"}
                    </p>
                  </Link>
                  <StatusBadge status={strategy.status} />
                  <StrategyListActions strategyId={strategy.id} status={strategy.status} />
                </div>
              );
            })
          )}
        </div>
      ))}

      {event.companies.length === 0 && (
        <EmptyState
          icon={Target}
          title="Aucune entreprise"
          description="Ajoutez une entreprise a cet evenement."
        />
      )}
    </div>
  );
}
