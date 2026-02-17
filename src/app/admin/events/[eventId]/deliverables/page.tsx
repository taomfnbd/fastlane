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

export const metadata = { title: "Deliverables Management" };

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
          deliverables: {
            orderBy: { createdAt: "desc" },
          },
        },
        ...(companyFilter ? { where: { companyId: companyFilter } } : {}),
      },
    },
  });

  if (!event) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 h-7 text-xs text-muted-foreground">
          <Link href={`/admin/events/${eventId}`}>
            <ArrowLeft className="mr-1 h-3 w-3" />
            {event.name}
          </Link>
        </Button>
        <PageHeader title="Deliverables" />
      </div>

      {event.companies.map((ec) => (
        <div key={ec.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">{ec.company.name}</h2>
            <CreateDeliverableDialog eventCompanyId={ec.id} companyName={ec.company.name} />
          </div>

          {ec.deliverables.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No deliverables yet"
              description={`Create a deliverable for ${ec.company.name}.`}
              action={<CreateDeliverableDialog eventCompanyId={ec.id} companyName={ec.company.name} />}
            />
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left font-medium px-3 py-2">Title</th>
                    <th className="text-left font-medium px-3 py-2 hidden sm:table-cell">Type</th>
                    <th className="text-left font-medium px-3 py-2 hidden md:table-cell">Version</th>
                    <th className="text-left font-medium px-3 py-2">Status</th>
                    <th className="px-3 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ec.deliverables.map((deliverable) => (
                    <tr key={deliverable.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-3 py-2.5">
                        <p className="font-medium">{deliverable.title}</p>
                        {deliverable.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{deliverable.description}</p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                        {deliverable.type.replace(/_/g, " ").toLowerCase()}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground hidden md:table-cell tabular-nums">
                        v{deliverable.version}
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={deliverable.status} />
                      </td>
                      <td className="px-3 py-2.5">
                        {deliverable.status === "DRAFT" && (
                          <SubmitDeliverableButton deliverableId={deliverable.id} />
                        )}
                      </td>
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
