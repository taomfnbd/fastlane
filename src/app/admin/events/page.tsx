import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { CreateEventDialog } from "@/components/admin/create-event-dialog";

export const metadata = { title: "Evenements" };

export default async function EventsPage() {
  await requireAdmin();
  const events = await prisma.event.findMany({ orderBy: { startDate: "desc" }, include: { companies: { include: { company: { select: { name: true } } } } } });

  return (
    <div className="space-y-4">
      <PageHeader title="Evenements" action={<CreateEventDialog />} />
      {events.length === 0 ? (
        <EmptyState icon={Calendar} title="Aucun evenement" description="Creez votre premier evenement." action={<CreateEventDialog />} />
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="text-left font-medium px-3 py-2">Nom</th>
                <th className="text-left font-medium px-3 py-2 hidden sm:table-cell">Dates</th>
                <th className="text-left font-medium px-3 py-2 hidden md:table-cell">Entreprises</th>
                <th className="text-left font-medium px-3 py-2">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/events/${event.id}`} className="font-medium hover:underline">{event.name}</Link>
                    {event.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{event.description}</p>}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                    {new Date(event.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} — {new Date(event.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground hidden md:table-cell">
                    {event.companies.length === 0 ? "—" : event.companies.map((ec) => ec.company.name).join(", ")}
                  </td>
                  <td className="px-3 py-2.5"><StatusBadge status={event.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
