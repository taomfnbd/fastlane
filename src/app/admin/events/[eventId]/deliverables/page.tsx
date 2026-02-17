import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Package, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CreateDeliverableDialog } from "@/components/admin/create-deliverable-dialog";
import { SubmitDeliverableButton } from "@/components/admin/submit-deliverable-button";

export const metadata = { title: "Gestion des livrables" };

export default async function EventDeliverablesPage({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ company?: string }> }) {
  await requireAdmin();
  const { eventId } = await params;
  const { company: companyFilter } = await searchParams;
  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { companies: { include: { company: { select: { id: true, name: true } }, deliverables: { orderBy: { createdAt: "desc" } } }, ...(companyFilter ? { where: { companyId: companyFilter } } : {}) } } });
  if (!event) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 h-7 text-xs text-muted-foreground">
          <Link href={`/admin/events/${eventId}`}><ArrowLeft className="mr-1 h-3 w-3" />{event.name}</Link>
        </Button>
        <PageHeader title="Livrables" />
      </div>
      {event.companies.map((ec) => (
        <div key={ec.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">{ec.company.name}</h2>
            <CreateDeliverableDialog eventCompanyId={ec.id} companyName={ec.company.name} />
          </div>
          {ec.deliverables.length === 0 ? (
            <EmptyState icon={Package} title="Aucun livrable" description={`Creez un livrable pour ${ec.company.name}.`} action={<CreateDeliverableDialog eventCompanyId={ec.id} companyName={ec.company.name} />} />
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left font-medium px-3 py-2">Titre</th>
                    <th className="text-left font-medium px-3 py-2 hidden sm:table-cell">Type</th>
                    <th className="text-left font-medium px-3 py-2 hidden md:table-cell">Version</th>
                    <th className="text-left font-medium px-3 py-2">Statut</th>
                    <th className="px-3 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ec.deliverables.map((d) => (
                    <tr key={d.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-3 py-2.5">
                        <p className="font-medium">{d.title}</p>
                        {d.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{d.description}</p>}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground hidden sm:table-cell whitespace-nowrap">{d.type.replace(/_/g, " ").toLowerCase()}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground hidden md:table-cell tabular-nums">v{d.version}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={d.status} /></td>
                      <td className="px-3 py-2.5">{d.status === "DRAFT" && <SubmitDeliverableButton deliverableId={d.id} />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
