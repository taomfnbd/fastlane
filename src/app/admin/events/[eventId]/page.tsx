import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Calendar, Target, Package, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EventStatusSelect } from "@/components/admin/event-status-select";
import { AddCompanyToEvent } from "@/components/admin/add-company-to-event";

export async function generateMetadata({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { name: true } });
  return { title: event?.name ?? "Evenement" };
}

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  await requireAdmin();
  const { eventId } = await params;
  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { companies: { include: { company: true, strategies: { select: { id: true, status: true, title: true } }, deliverables: { select: { id: true, status: true, title: true, type: true } } } } } });
  if (!event) notFound();
  const allCompanies = await prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  const availableCompanies = allCompanies.filter((c) => !event.companies.some((ec) => ec.companyId === c.id));

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 h-7 text-xs text-muted-foreground">
          <Link href="/admin/events"><ArrowLeft className="mr-1 h-3 w-3" />Evenements</Link>
        </Button>
        <PageHeader title={event.name} description={event.description ?? undefined} action={<EventStatusSelect eventId={event.id} currentStatus={event.status} />} />
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(event.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })} — {new Date(event.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
        </div>
        <StatusBadge status={event.status} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium">Entreprises ({event.companies.length})</h2>
          {availableCompanies.length > 0 && <AddCompanyToEvent eventId={event.id} companies={availableCompanies} />}
        </div>
        {event.companies.length === 0 ? (
          <p className="text-xs text-muted-foreground py-8 text-center">Aucune entreprise ajoutee.</p>
        ) : (
          <div className="rounded-md border divide-y">
            {event.companies.map((ec) => {
              const stratCount = ec.strategies.length;
              const delivCount = ec.deliverables.length;
              const approvedStrats = ec.strategies.filter((s) => s.status === "APPROVED").length;
              const approvedDelivs = ec.deliverables.filter((d) => d.status === "APPROVED" || d.status === "DELIVERED").length;
              return (
                <div key={ec.id} className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Link href={`/admin/companies/${ec.companyId}`} className="text-sm font-medium hover:underline">{ec.company.name}</Link>
                    <StatusBadge status={ec.company.plan} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Target className="h-3 w-3" />{approvedStrats}/{stratCount} strategies</span>
                    <span className="flex items-center gap-1"><Package className="h-3 w-3" />{approvedDelivs}/{delivCount} livrables</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild className="h-7 text-xs"><Link href={`/admin/events/${event.id}/strategy?company=${ec.companyId}`}>Strategie</Link></Button>
                    <Button size="sm" variant="outline" asChild className="h-7 text-xs"><Link href={`/admin/events/${event.id}/deliverables?company=${ec.companyId}`}>Livrables</Link></Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
