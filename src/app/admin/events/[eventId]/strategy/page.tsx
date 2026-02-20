import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Target, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CreateStrategyDialog } from "@/components/admin/create-strategy-dialog";
import { SubmitStrategyButton } from "@/components/admin/submit-strategy-button";
import { AddStrategyItemDialog } from "@/components/admin/add-strategy-item-dialog";
import { EditStrategyDialog } from "@/components/admin/edit-strategy-dialog";
import { EditStrategyItemDialog } from "@/components/admin/edit-strategy-item-dialog";
import { ResubmitButton } from "@/components/admin/resubmit-button";

export const metadata = { title: "Gestion des strategies" };

export default async function EventStrategyPage({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ company?: string }> }) {
  await requireAdmin();
  const { eventId } = await params;
  const { company: companyFilter } = await searchParams;
  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { companies: { include: { company: { select: { id: true, name: true } }, strategies: { include: { items: { orderBy: { order: "asc" } } }, orderBy: { createdAt: "desc" } } }, ...(companyFilter ? { where: { companyId: companyFilter } } : {}) } } });
  if (!event) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 h-7 text-xs text-muted-foreground">
          <Link href={`/admin/events/${eventId}`}><ArrowLeft className="mr-1 h-3 w-3" />{event.name}</Link>
        </Button>
        <PageHeader title="Strategies" />
      </div>
      {event.companies.map((ec) => (
        <div key={ec.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">{ec.company.name}</h2>
            <CreateStrategyDialog eventCompanyId={ec.id} companyName={ec.company.name} />
          </div>
          {ec.strategies.length === 0 ? (
            <EmptyState icon={Target} title="Aucune strategie" description={`Creez une strategie pour ${ec.company.name}.`} action={<CreateStrategyDialog eventCompanyId={ec.id} companyName={ec.company.name} />} />
          ) : (
            ec.strategies.map((strategy) => (
              <div key={strategy.id} className="rounded-md border">
                <div className="flex items-center justify-between px-3 py-2.5 border-b">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{strategy.title}</p>
                    {strategy.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{strategy.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <StatusBadge status={strategy.status} />
                    <EditStrategyDialog strategy={{ id: strategy.id, title: strategy.title, description: strategy.description }} />
                    {strategy.status === "DRAFT" && <SubmitStrategyButton strategyId={strategy.id} />}
                    {strategy.status === "CHANGES_REQUESTED" && <ResubmitButton id={strategy.id} type="strategy" />}
                  </div>
                </div>
                <div className="divide-y">
                  {strategy.items.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm"><span className="text-muted-foreground tabular-nums">{index + 1}.</span> {item.title}</p>
                        {item.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 pl-5">{item.description}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-3">
                        <StatusBadge status={item.status} />
                        <EditStrategyItemDialog item={{ id: item.id, title: item.title, description: item.description }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-3 py-2 border-t"><AddStrategyItemDialog strategyId={strategy.id} /></div>
              </div>
            ))
          )}
        </div>
      ))}
    </div>
  );
}
