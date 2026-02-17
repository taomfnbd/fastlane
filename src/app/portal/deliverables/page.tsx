import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Package } from "lucide-react";
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
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Livrables" />

      {deliverables.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Aucun livrable"
          description="Les livrables apparaitront ici une fois prepares par l'equipe."
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
              {deliverables.map((deliverable) => (
                <tr key={deliverable.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-3 py-2.5">
                    <Link href={`/portal/deliverables/${deliverable.id}`} className="font-medium hover:underline">
                      {deliverable.title}
                    </Link>
                    {deliverable.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{deliverable.description}</p>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                    {deliverable.type.replace(/_/g, " ").toLowerCase()}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground hidden md:table-cell">
                    {deliverable.eventCompany.event.name}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground hidden md:table-cell tabular-nums">
                    v{deliverable.version}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={deliverable.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
