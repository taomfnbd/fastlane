import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getDeliverableTypeLabel, EMPTY_STATES } from "@/lib/portal-constants";
import { Package, MessageSquare } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Livrables" };

export default async function PortalDeliverablesPage() {
  const session = await requireClient();

  const deliverables = await prisma.deliverable.findMany({
    where: {
      eventCompany: { companyId: session.companyId },
      status: { not: "DRAFT" },
    },
    include: {
      eventCompany: {
        include: { event: { select: { name: true } } },
      },
      _count: { select: { comments: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const needsValidation = (status: string) =>
    status === "IN_REVIEW" || status === "REVISED";

  return (
    <div className="space-y-4">
      <PageHeader title="Livrables" />

      {deliverables.length === 0 ? (
        <EmptyState
          icon={Package}
          title={EMPTY_STATES.deliverables.title}
          description={EMPTY_STATES.deliverables.description}
        />
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="text-left font-medium px-3 py-2">Titre</th>
                <th className="text-left font-medium px-3 py-2 hidden sm:table-cell">Type</th>
                <th className="text-left font-medium px-3 py-2 hidden md:table-cell">Evenement</th>
                <th className="text-left font-medium px-3 py-2 hidden md:table-cell">Version</th>
                <th className="text-left font-medium px-3 py-2">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {deliverables.map((deliverable) => {
                const showValidationBadge = needsValidation(deliverable.status);
                return (
                  <tr key={deliverable.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Link href={`/portal/deliverables/${deliverable.id}`} className="font-medium hover:underline">
                          {deliverable.title}
                        </Link>
                        {showValidationBadge && (
                          <span className="shrink-0 inline-flex items-center rounded-full bg-red-100 dark:bg-red-950 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:text-red-400">
                            A valider
                          </span>
                        )}
                      </div>
                      {deliverable.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{deliverable.description}</p>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                      {getDeliverableTypeLabel(deliverable.type)}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground hidden md:table-cell">
                      {deliverable.eventCompany.event.name}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground hidden md:table-cell tabular-nums">
                      v{deliverable.version}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={deliverable.status} />
                        {deliverable._count.comments > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <MessageSquare className="h-3 w-3" />
                            {deliverable._count.comments}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
