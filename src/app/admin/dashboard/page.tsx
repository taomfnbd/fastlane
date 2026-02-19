import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ProgressBar } from "@/components/shared/progress-bar";
import { Calendar, Building2, Package, Target } from "lucide-react";
import { cn, relativeTime } from "@/lib/utils";
import Link from "next/link";

export const metadata = { title: "Tableau de bord" };

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [
    activeEventsCount,
    totalCompanies,
    pendingDeliverables,
    totalDeliverables,
    approvedDeliverables,
    pendingStrategies,
    totalStrategies,
    approvedStrategies,
    activeEvents,
    actionItems,
    recentActivities,
  ] = await Promise.all([
    prisma.event.count({ where: { status: "ACTIVE" } }),
    prisma.company.count(),
    prisma.deliverable.count({ where: { status: { in: ["IN_REVIEW", "CHANGES_REQUESTED"] } } }),
    prisma.deliverable.count(),
    prisma.deliverable.count({ where: { status: { in: ["APPROVED", "DELIVERED"] } } }),
    prisma.strategy.count({ where: { status: { in: ["PENDING_REVIEW", "CHANGES_REQUESTED"] } } }),
    prisma.strategy.count(),
    prisma.strategy.count({ where: { status: "APPROVED" } }),
    prisma.event.findMany({
      where: { status: "ACTIVE" },
      orderBy: { startDate: "desc" },
      include: {
        companies: {
          include: {
            company: { select: { name: true } },
            strategies: { select: { status: true } },
            deliverables: { select: { status: true } },
          },
        },
      },
    }),
    Promise.all([
      prisma.strategy.findMany({
        where: { status: { in: ["PENDING_REVIEW", "CHANGES_REQUESTED"] } },
        take: 10,
        orderBy: { updatedAt: "desc" },
        include: {
          eventCompany: {
            include: {
              company: { select: { name: true } },
              event: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.deliverable.findMany({
        where: { status: { in: ["IN_REVIEW", "CHANGES_REQUESTED"] } },
        take: 10,
        orderBy: { updatedAt: "desc" },
        include: {
          eventCompany: {
            include: {
              company: { select: { name: true } },
              event: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]),
    prisma.activity.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
  ]);

  const delivProgress = totalDeliverables > 0 ? Math.round((approvedDeliverables / totalDeliverables) * 100) : 0;
  const stratProgress = totalStrategies > 0 ? Math.round((approvedStrategies / totalStrategies) * 100) : 0;

  const stats = [
    {
      label: "Evenements actifs",
      value: activeEventsCount,
      icon: Calendar,
      progress: undefined as number | undefined,
      subText: undefined as string | undefined,
    },
    {
      label: "Entreprises",
      value: totalCompanies,
      icon: Building2,
      progress: undefined as number | undefined,
      subText: undefined as string | undefined,
    },
    {
      label: "Livrables en attente",
      value: pendingDeliverables,
      icon: Package,
      progress: delivProgress,
      subText: `${approvedDeliverables}/${totalDeliverables} approuves`,
    },
    {
      label: "Strategies en attente",
      value: pendingStrategies,
      icon: Target,
      progress: stratProgress,
      subText: `${approvedStrategies}/${totalStrategies} approuvees`,
    },
  ];

  const [pendingStrats, pendingDelivs] = actionItems;
  const allActionItems = [
    ...pendingStrats.map((s) => ({
      kind: "strategy" as const,
      id: s.id,
      title: s.title,
      status: s.status,
      company: s.eventCompany.company.name,
      event: s.eventCompany.event.name,
      eventId: s.eventCompany.event.id,
      updatedAt: s.updatedAt,
      companyId: s.eventCompany.companyId,
    })),
    ...pendingDelivs.map((d) => ({
      kind: "deliverable" as const,
      id: d.id,
      title: d.title,
      status: d.status,
      company: d.eventCompany.company.name,
      event: d.eventCompany.event.name,
      eventId: d.eventCompany.event.id,
      updatedAt: d.updatedAt,
      companyId: d.eventCompany.companyId,
    })),
  ]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader title="Tableau de bord" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-background p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <stat.icon className="h-3.5 w-3.5" />
              {stat.label}
            </div>
            <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
            {stat.progress !== undefined && (
              <div className="space-y-1">
                <ProgressBar value={stat.progress} />
                <p className="text-[11px] text-muted-foreground">{stat.subText}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Event progression */}
      {activeEvents.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium">Progression des evenements</h2>
          <div className="rounded-md border divide-y">
            {activeEvents.map((event) => {
              const totalItems = event.companies.reduce(
                (sum, ec) => sum + ec.strategies.length + ec.deliverables.length,
                0
              );
              const approvedItems = event.companies.reduce(
                (sum, ec) =>
                  sum +
                  ec.strategies.filter((s) => s.status === "APPROVED").length +
                  ec.deliverables.filter(
                    (d) => d.status === "APPROVED" || d.status === "DELIVERED"
                  ).length,
                0
              );
              const pct = totalItems > 0 ? Math.round((approvedItems / totalItems) * 100) : 0;
              return (
                <Link
                  key={event.id}
                  href={`/admin/events/${event.id}`}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{event.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {event.companies.length} entreprise
                      {event.companies.length !== 1 ? "s" : ""} · {approvedItems}/{totalItems}{" "}
                      valides
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 w-40">
                    <ProgressBar value={pct} className="flex-1" />
                    <span
                      className={cn(
                        "text-xs font-medium tabular-nums w-8 text-right",
                        pct >= 70
                          ? "text-emerald-600"
                          : pct >= 40
                            ? "text-amber-600"
                            : "text-red-600"
                      )}
                    >
                      {pct}%
                    </span>
                  </div>
                  <StatusBadge status={event.status} />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Action items + Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Action items */}
        <div>
          <h2 className="text-sm font-medium mb-3">En attente d&apos;action</h2>
          {allActionItems.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">
              Aucun element en attente
            </p>
          ) : (
            <div className="rounded-md border divide-y">
              {allActionItems.map((item) => (
                <Link
                  key={`${item.kind}-${item.id}`}
                  href={
                    item.kind === "strategy"
                      ? `/admin/events/${item.eventId}/strategy?company=${item.companyId}`
                      : `/admin/events/${item.eventId}/deliverables?company=${item.companyId}`
                  }
                  className="flex items-start gap-3 px-3 py-2.5 hover:bg-accent/50 transition-colors"
                >
                  <div
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      item.status === "CHANGES_REQUESTED" ? "bg-red-500" : "bg-amber-500"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.company} · {item.event}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusBadge status={item.status} />
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                      {relativeTime(item.updatedAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Activity */}
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
                      {new Date(activity.createdAt).toLocaleDateString("fr-FR", {
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
