import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { relativeTime } from "@/lib/utils";
import Link from "next/link";

export const metadata = { title: "Accueil" };

export default async function PortalDashboardPage() {
  const session = await requireClient();

  const [company, eventCompanies, activities] = await Promise.all([
    prisma.company.findUnique({
      where: { id: session.companyId },
      select: { name: true },
    }),
    prisma.eventCompany.findMany({
      where: { companyId: session.companyId },
      include: {
        event: {
          select: { name: true, status: true, startDate: true, endDate: true },
        },
        strategies: {
          where: { status: { not: "DRAFT" } },
          select: { id: true, status: true, title: true, updatedAt: true },
        },
        deliverables: {
          where: { status: { not: "DRAFT" } },
          select: {
            id: true,
            status: true,
            title: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { event: { startDate: "desc" } },
    }),
    prisma.activity.findMany({
      where: {
        OR: [
          { strategy: { eventCompany: { companyId: session.companyId } } },
          { deliverable: { eventCompany: { companyId: session.companyId } } },
        ],
      },
      include: {
        user: { select: { name: true, role: true } },
        strategy: { select: { id: true } },
        deliverable: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const companyName = company?.name ?? "Entreprise";

  const activeEc = eventCompanies.find(
    (ec) => ec.event.status === "ACTIVE" || ec.event.status === "REVIEW"
  ) ?? eventCompanies[0];

  const now = new Date();

  let daysElapsed = 0;
  let totalDays = 1;
  let daysRemaining = 0;
  let eventName = "Fastlane";

  if (activeEc) {
    const start = new Date(activeEc.event.startDate);
    const end = new Date(activeEc.event.endDate);
    eventName = activeEc.event.name;
    totalDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );
    daysElapsed = Math.max(
      0,
      Math.min(
        totalDays,
        Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      )
    );
    daysRemaining = Math.max(
      0,
      Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
  }

  let totalDeliverables = 0;
  let validatedDeliverables = 0;
  let pendingStrategies = 0;

  const actionItems: { kind: "strategy" | "deliverable"; id: string; title: string; status: string; updatedAt: Date }[] = [];

  for (const ec of eventCompanies) {
    for (const s of ec.strategies) {
      if (s.status === "PENDING_REVIEW" || s.status === "REVISED") {
        pendingStrategies++;
        actionItems.push({ kind: "strategy", id: s.id, title: s.title, status: s.status, updatedAt: s.updatedAt });
      }
    }
    for (const d of ec.deliverables) {
      totalDeliverables++;
      if (d.status === "APPROVED" || d.status === "DELIVERED") {
        validatedDeliverables++;
      }
      if (d.status === "IN_REVIEW" || d.status === "REVISED") {
        actionItems.push({ kind: "deliverable", id: d.id, title: d.title, status: d.status, updatedAt: d.updatedAt });
      }
    }
  }

  actionItems.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const progressPercent =
    totalDeliverables > 0
      ? Math.round((validatedDeliverables / totalDeliverables) * 100)
      : 0;

  const activityItems = activities.map((activity) => {
    const isTeam =
      activity.user.role === "SUPER_ADMIN" || activity.user.role === "ADMIN";

    let href: string | null = null;
    if (activity.strategy) {
      href = `/portal/strategy/${activity.strategy.id}`;
    } else if (activity.deliverable) {
      href = `/portal/deliverables/${activity.deliverable.id}`;
    }

    const hoursAgo =
      (now.getTime() - new Date(activity.createdAt).getTime()) /
      (1000 * 60 * 60);
    let dotColor = "bg-muted-foreground/40";
    let dotGlow = "";
    if (hoursAgo < 2) {
      dotColor = "bg-amber-500";
      dotGlow = "shadow-[0_0_8px_rgba(245,158,11,0.5)]";
    } else if (hoursAgo < 24) {
      dotColor = "bg-blue-500";
      dotGlow = "shadow-[0_0_8px_rgba(59,130,246,0.5)]";
    }

    return {
      id: activity.id,
      title: `${isTeam ? "L\u2019equipe Fastlane" : "Vous"} ${activity.message}`,
      time: activity.createdAt,
      href,
      dotColor,
      dotGlow,
    };
  });

  return (
    <div className="animate-fade-up space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Greeting + Event badge */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Bonjour,{" "}
              <span className="text-[#6961ff]">{companyName}</span>
            </h1>
            {activeEc && (
              <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-[#6961ff] border border-primary/20">
                {eventName} — Jour {daysElapsed} sur {totalDays}
              </div>
            )}
          </div>

          {/* Progress card */}
          {totalDeliverables > 0 && (
            <div className="bg-card rounded-2xl p-6 lg:p-8 shadow-portal-card border border-primary/5">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="text-muted-foreground text-xs lg:text-sm font-semibold uppercase tracking-wider mb-2">
                    Validation des livrables
                  </h3>
                  <p className="text-xl lg:text-2xl font-bold text-foreground">
                    {validatedDeliverables} livrable{validatedDeliverables > 1 ? "s" : ""} valid&eacute;{validatedDeliverables > 1 ? "s" : ""} sur {totalDeliverables}
                  </p>
                </div>
                <div className="text-amber-500 font-bold text-3xl lg:text-4xl">
                  {progressPercent}%
                </div>
              </div>
              <div className="w-full h-3 lg:h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full custom-glow transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions requises */}
          {actionItems.length > 0 && (
            <div className="bg-card rounded-2xl p-6 shadow-portal-card border border-amber-500/20">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="text-sm font-semibold text-foreground">
                  Actions requises ({actionItems.length})
                </h3>
              </div>
              <div className="space-y-2">
                {actionItems.slice(0, 5).map((item) => (
                  <Link
                    key={`${item.kind}-${item.id}`}
                    href={item.kind === "strategy" ? `/portal/strategy/${item.id}` : `/portal/deliverables/${item.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-background border border-primary/5 hover:shadow-md transition-all group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-amber-500 text-base">
                        {item.kind === "strategy" ? "pending_actions" : "description"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate group-hover:text-[#6961ff] transition-colors">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.kind === "strategy" ? "Stratégie" : "Livrable"} · {relativeTime(item.updatedAt)}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-muted-foreground/30 group-hover:text-[#6961ff] transition-colors">chevron_right</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
            {/* Strategies pending */}
            <div className="bg-card p-6 rounded-2xl shadow-portal-card border border-primary/5 flex flex-row sm:flex-col items-center sm:text-center gap-4 sm:gap-0 justify-between sm:justify-start">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center sm:mb-4 shrink-0">
                <span className="material-symbols-outlined text-[#6961ff] text-2xl">pending_actions</span>
              </div>
              <div className="text-right sm:text-center">
                <span className="block text-2xl lg:text-3xl font-bold text-foreground">{pendingStrategies}</span>
                <span className="text-[10px] lg:text-xs uppercase text-muted-foreground font-bold tracking-wider mt-1 block">Stratégies en attente</span>
              </div>
            </div>

            {/* Deliverables submitted */}
            <div className="bg-card p-6 rounded-2xl shadow-portal-card border border-primary/5 flex flex-row sm:flex-col items-center sm:text-center gap-4 sm:gap-0 justify-between sm:justify-start">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center sm:mb-4 shrink-0">
                <span className="material-symbols-outlined text-emerald-500 text-2xl">check_circle</span>
              </div>
              <div className="text-right sm:text-center">
                <span className="block text-2xl lg:text-3xl font-bold text-foreground">{validatedDeliverables}/{totalDeliverables}</span>
                <span className="text-[10px] lg:text-xs uppercase text-muted-foreground font-bold tracking-wider mt-1 block">Délivrables soumis</span>
              </div>
            </div>

            {/* Days remaining */}
            <div className="bg-card p-6 rounded-2xl shadow-portal-card border border-primary/5 flex flex-row sm:flex-col items-center sm:text-center gap-4 sm:gap-0 justify-between sm:justify-start">
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center sm:mb-4 shrink-0">
                <span className="material-symbols-outlined text-blue-500 text-2xl">calendar_month</span>
              </div>
              <div className="text-right sm:text-center">
                <span className="block text-2xl lg:text-3xl font-bold text-foreground">{daysRemaining}</span>
                <span className="text-[10px] lg:text-xs uppercase text-muted-foreground font-bold tracking-wider mt-1 block">Jours restants</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Activity */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-2xl p-6 shadow-portal-card border border-primary/5">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-muted-foreground text-lg">schedule</span>
              <h2 className="text-sm font-semibold text-foreground">
                Activité récente
              </h2>
            </div>

            {activityItems.length > 0 ? (
              <div className="space-y-2">
                {activityItems.map((item) => {
                  const content = (
                    <div className="group flex items-center gap-4 p-4 rounded-2xl bg-background border border-primary/5 hover:shadow-lg transition-all cursor-pointer">
                      <span
                        className={`h-3 w-3 shrink-0 rounded-full ${item.dotColor} ${item.dotGlow}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-[#6961ff] transition-colors">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {relativeTime(item.time)}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-muted-foreground/30 group-hover:text-[#6961ff] transition-colors">chevron_right</span>
                    </div>
                  );

                  if (item.href) {
                    return (
                      <Link key={item.id} href={item.href}>
                        {content}
                      </Link>
                    );
                  }
                  return <div key={item.id}>{content}</div>;
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune activité pour le moment.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
