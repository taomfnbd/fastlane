import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Package } from "lucide-react";
import Link from "next/link";
import { CreateDeliverableDialog } from "@/components/admin/create-deliverable-dialog";
import { DeliverableListActions } from "@/components/admin/deliverable-list-actions";

export const metadata = { title: "Gestion des livrables" };

export default async function EventDeliverablesPage({
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
          deliverables: { orderBy: { createdAt: "desc" } },
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
          <h2 className="text-sm font-semibold">Livrables</h2>
        </div>
      </div>

      {event.companies.map((ec) => (
        <div key={ec.id} className="space-y-1">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-medium text-muted-foreground">{ec.company.name}</p>
            <CreateDeliverableDialog eventCompanyId={ec.id} companyName={ec.company.name} />
          </div>
          {ec.deliverables.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 px-1 py-3">Aucun livrable</p>
          ) : (
            ec.deliverables.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-2.5 rounded-md px-2 py-2 hover:bg-accent/50 transition-colors"
              >
                <Link
                  href={`/admin/events/${eventId}/deliverables/${d.id}`}
                  className="min-w-0 flex-1"
                >
                  <p className="text-sm font-medium truncate">{d.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {d.type.replace(/_/g, " ").toLowerCase()} · v{d.version}
                  </p>
                </Link>
                <StatusBadge status={d.status} />
                <DeliverableListActions deliverableId={d.id} status={d.status} />
              </div>
            ))
          )}
        </div>
      ))}

      {event.companies.length === 0 && (
        <EmptyState
          icon={Package}
          title="Aucune entreprise"
          description="Ajoutez une entreprise a cet evenement."
        />
      )}
    </div>
  );
}
