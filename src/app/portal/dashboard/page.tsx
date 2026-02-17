import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Target, Package, Clock, Bell } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Tableau de bord" };

export default async function PortalDashboardPage() {
  const session = await requireClient();

  const eventCompanies = await prisma.eventCompany.findMany({
    where: { companyId: session.companyId },
    include: {
      event: true,
      strategies: { select: { id: true, status: true, title: true, updatedAt: true } },
      deliverables: { select: { id: true, status: true, title: true, type: true, updatedAt: true } },
    },
    orderBy: { event: { startDate: "desc" } },
  });

  const activeEvent = eventCompanies.find((ec) => ec.event.status === "ACTIVE");

  const totalStrategies = eventCompanies.reduce((sum, ec) => sum + ec.strategies.length, 0);
  const pendingStrategies = eventCompanies.reduce(
    (sum, ec) => sum + ec.strategies.filter((s) => s.status === "PENDING_REVIEW").length,
    0
  );
  const totalDeliverables = eventCompanies.reduce((sum, ec) => sum + ec.deliverables.length, 0);
  const pendingDeliverables = eventCompanies.reduce(
    (sum, ec) => sum + ec.deliverables.filter((d) => d.status === "IN_REVIEW").length,
    0
  );

  const recentNotifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  const stats = [
    { label: "Strategies", value: totalStrategies, sub: `${pendingStrategies} a reviser`, icon: Target },
    { label: "Livrables", value: totalDeliverables, sub: `${pendingDeliverables} a reviser`, icon: Package },
    { label: "Evenement actif", value: activeEvent?.event.name ?? "Aucun", sub: activeEvent ? `fin le ${new Date(activeEvent.event.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}` : "—", icon: Clock },
    { label: "Non lues", value: recentNotifications.filter((n) => !n.read).length, sub: "notifications", icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Tableau de bord" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-md border bg-border overflow-hidden">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-background p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <stat.icon className="h-3.5 w-3.5" />
              {stat.label}
            </div>
            <p className="text-2xl font-semibold mt-1 truncate">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Items to review */}
        <div>
          <h2 className="text-sm font-medium mb-3">A reviser</h2>
          {pendingStrategies === 0 && pendingDeliverables === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Rien a reviser pour le moment.</p>
          ) : (
            <div className="rounded-md border divide-y">
              {eventCompanies.flatMap((ec) =>
                ec.strategies
                  .filter((s) => s.status === "PENDING_REVIEW")
                  .map((s) => (
                    <Link
                      key={s.id}
                      href={`/portal/strategy/${s.id}`}
                      className="flex items-center justify-between px-3 py-2.5 hover:bg-accent/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{s.title}</p>
                        <p className="text-[11px] text-muted-foreground">Strategie</p>
                      </div>
                      <StatusBadge status={s.status} />
                    </Link>
                  ))
              )}
              {eventCompanies.flatMap((ec) =>
                ec.deliverables
                  .filter((d) => d.status === "IN_REVIEW")
                  .map((d) => (
                    <Link
                      key={d.id}
                      href={`/portal/deliverables/${d.id}`}
                      className="flex items-center justify-between px-3 py-2.5 hover:bg-accent/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{d.title}</p>
                        <p className="text-[11px] text-muted-foreground">{d.type.replace(/_/g, " ").toLowerCase()}</p>
                      </div>
                      <StatusBadge status={d.status} />
                    </Link>
                  ))
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div>
          <h2 className="text-sm font-medium mb-3">Notifications</h2>
          {recentNotifications.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Aucune notification.</p>
          ) : (
            <div className="space-y-0">
              {recentNotifications.map((notification) => (
                <div key={notification.id} className="flex items-start gap-2.5 py-2">
                  <div
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                      notification.read ? "bg-muted-foreground/20" : "bg-blue-500"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium">{notification.title}</p>
                    <p className="text-[11px] text-muted-foreground">{notification.message}</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                      {new Date(notification.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
