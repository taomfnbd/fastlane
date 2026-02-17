import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={`/admin/events/${eventId}`}>
            <ArrowLeft className="mr-1 h-3 w-3" />
            Back to Event
          </Link>
        </Button>
        <PageHeader
          title="Deliverables Management"
          description={`${event.name} — Manage deliverables`}
        />
      </div>

      {event.companies.map((ec) => (
        <div key={ec.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{ec.company.name}</h2>
            <CreateDeliverableDialog
              eventCompanyId={ec.id}
              companyName={ec.company.name}
            />
          </div>

          {ec.deliverables.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No deliverables yet"
              description={`Create a deliverable for ${ec.company.name}.`}
              action={
                <CreateDeliverableDialog
                  eventCompanyId={ec.id}
                  companyName={ec.company.name}
                />
              }
            />
          ) : (
            <div className="grid gap-3">
              {ec.deliverables.map((deliverable) => (
                <Card key={deliverable.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{deliverable.title}</p>
                        {deliverable.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {deliverable.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {deliverable.type.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            v{deliverable.version}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={deliverable.status} />
                        {deliverable.status === "DRAFT" && (
                          <SubmitDeliverableButton deliverableId={deliverable.id} />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
