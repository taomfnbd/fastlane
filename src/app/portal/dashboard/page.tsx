import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { relativeTime } from "@/lib/utils";
import {
  Target,
  Calendar,
  Clock,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
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

  // Find the active (or most recent) event for the badge
  const activeEc = eventCompanies.find(
    (ec) => ec.event.status === "ACTIVE" || ec.event.status === "REVIEW"
  ) ?? eventCompanies[0];

  const now = new Date();

  // Event timing calculations
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

  // Aggregate counts across all event companies
  let totalDeliverables = 0;
  let validatedDeliverables = 0;
  let pendingStrategies = 0;
  let lastDeliverableUpdate: Date | null = null;

  for (const ec of eventCompanies) {
    for (const s of ec.strategies) {
      if (s.status === "PENDING_REVIEW" || s.status === "REVISED") {
        pendingStrategies++;
      }
    }
    for (const d of ec.deliverables) {
      totalDeliverables++;
      if (d.status === "APPROVED" || d.status === "DELIVERED") {
        validatedDeliverables++;
      }
      if (!lastDeliverableUpdate || d.updatedAt > lastDeliverableUpdate) {
        lastDeliverableUpdate = d.updatedAt;
      }
    }
  }

  const progressPercent =
    totalDeliverables > 0
      ? Math.round((validatedDeliverables / totalDeliverables) * 100)
      : 0;

  // Build activity items with hrefs
  const activityItems = activities.map((activity) => {
    const isTeam =
      activity.user.role === "SUPER_ADMIN" || activity.user.role === "ADMIN";

    let href: string | null = null;
    if (activity.strategy) {
      href = `/portal/strategy/${activity.strategy.id}`;
    } else if (activity.deliverable) {
      href = `/portal/deliverables/${activity.deliverable.id}`;
    }

    // Color based on recency
    const hoursAgo =
      (now.getTime() - new Date(activity.createdAt).getTime()) /
      (1000 * 60 * 60);
    let dotColor = "bg-muted-foreground/40";
    if (hoursAgo < 2) dotColor = "bg-amber-500";
    else if (hoursAgo < 24) dotColor = "bg-blue-500";

    return {
      id: activity.id,
      title: `${isTeam ? "L\u2019equipe Fastlane" : "Vous"} ${activity.message}`,
      time: activity.createdAt,
      href,
      dotColor,
    };
  });

  return (
    <div className="animate-fade-up space-y-6">
      {/* Desktop: 2-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: 2/3 */}
        <div className="space-y-6 lg:col-span-2">
          {/* Greeting + Event badge */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Bonjour,{" "}
              <span className="text-primary">{companyName}</span>
            </h1>
            {activeEc && (
              <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                {eventName} — Jour {daysElapsed} sur {totalDays}
              </div>
            )}
          </div>

          {/* Progress card */}
          {totalDeliverables > 0 && (
            <div className="rounded-xl border border-border/50 bg-card p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Validation des livrables
              </p>
              <div className="mt-3 flex items-baseline justify-between">
                <p className="text-sm text-foreground">
                  {validatedDeliverables} livrable
                  {validatedDeliverables > 1 ? "s" : ""} valid&eacute;
                  {validatedDeliverables > 1 ? "s" : ""} sur{" "}
                  {totalDeliverables}
                </p>
                <span className="text-2xl font-bold text-primary">
                  {progressPercent}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {lastDeliverableUpdate && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Derni&egrave;re mise &agrave; jour{" "}
                  {relativeTime(lastDeliverableUpdate)}
                </p>
              )}
            </div>
          )}

          {/* Stats cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Strategies pending */}
            <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Strat&eacute;gies en attente
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {pendingStrategies}
                </p>
              </div>
            </div>

            {/* Deliverables submitted */}
            <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  D&eacute;livrables soumis
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {validatedDeliverables}/{totalDeliverables}
                </p>
              </div>
            </div>

            {/* Days remaining */}
            <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Jours restants
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {daysRemaining}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: 1/3 - Activity */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border/50 bg-card p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                Activit&eacute; r&eacute;cente
              </h2>
            </div>

            {activityItems.length > 0 ? (
              <div className="mt-4 space-y-1">
                {activityItems.map((item) => {
                  const content = (
                    <div className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/50">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${item.dotColor}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-foreground">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {relativeTime(item.time)}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
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
              <p className="mt-4 text-sm text-muted-foreground">
                Aucune activit&eacute; pour le moment.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
