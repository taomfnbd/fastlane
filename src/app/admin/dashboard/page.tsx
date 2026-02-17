import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Calendar, Building2, Package, Target } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Tableau de bord" };

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [activeEventsCount, totalCompanies, pendingDeliverables, pendingStrategies, recentEvents, recentActivities] = await Promise.all([
    prisma.event.count({ where: { status: "ACTIVE" } }),
    prisma.company.count(),
    prisma.deliverable.count({ where: { status: "IN_REVIEW" } }),
    prisma.strategy.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.event.findMany({ take: 5, orderBy: { updatedAt: "desc" }, include: { companies: { include: { company: true } } } }),
    prisma.activity.findMany({ take: 10, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }),
  ]);

  const stats = [
    { label: "Evenements actifs", value: activeEventsCount, icon: Calendar },
    { label: "Entreprises", value: totalCompanies, icon: Building2 },
    { label: "A reviser", value: pendingDeliverables, icon: Package },
    { label: "Strategies en attente", value: pendingStrategies, icon: Target },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Tableau de bord" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-md border bg-border overflow-hidden">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-background p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <stat.icon className="h-3.5 w-3.5" />
              {stat.label}
            </div>
            <p className="text-2xl font-semibold mt-1 tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium">Evenements recents</h2>
            <Link href="/admin/events" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Voir tout</Link>
          </div>
          {recentEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Aucun evenement</p>
          ) : (
            <div className="rounded-md border divide-y">
              {recentEvents.map((event) => (
                <Link key={event.id} href={`/admin/events/${event.id}`} className="flex items-center justify-between px-3 py-2.5 hover:bg-accent/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{event.name}</p>
                    <p className="text-[11px] text-muted-foreground">{event.companies.length} entreprise{event.companies.length !== 1 && "s"}</p>
                  </div>
                  <StatusBadge status={event.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-sm font-medium mb-3">Activite</h2>
          {recentActivities.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Aucune activite</p>
          ) : (
            <div className="space-y-0">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-2.5 py-2 text-sm">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium mt-0.5">
                    {activity.user.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs">
                      <span className="font-medium">{activity.user.name}</span>{" "}
                      <span className="text-muted-foreground">{activity.message}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground/60">
                      {new Date(activity.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
