import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { getDeliverableTypeLabel } from "@/lib/portal-constants";
import { relativeTime } from "@/lib/utils";
import {
  Target,
  Package,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Accueil" };

export default async function PortalDashboardPage() {
  const session = await requireClient();

  const [user, eventCompanies, activities] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    }),
    prisma.eventCompany.findMany({
      where: { companyId: session.companyId },
      include: {
        event: { select: { name: true, status: true } },
        strategies: {
          where: { status: { not: "DRAFT" } },
          select: {
            id: true,
            status: true,
            title: true,
            updatedAt: true,
            items: { select: { status: true } },
          },
        },
        deliverables: {
          where: { status: { not: "DRAFT" } },
          select: {
            id: true,
            status: true,
            title: true,
            type: true,
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
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const firstName = user?.name?.split(" ")[0] ?? "Bonjour";

  // Build action items (things requiring client attention)
  type ActionItem = {
    id: string;
    title: string;
    type: "strategy" | "deliverable";
    typeLabel: string;
    href: string;
    since: Date;
  };

  const actionItems: ActionItem[] = [];

  // Progression counters
  let totalStrategies = 0;
  let approvedStrategies = 0;
  let totalDeliverables = 0;
  let approvedDeliverables = 0;

  for (const ec of eventCompanies) {
    for (const s of ec.strategies) {
      totalStrategies++;
      if (s.status === "APPROVED") approvedStrategies++;
      if (s.status === "PENDING_REVIEW" || s.status === "REVISED") {
        const pendingItems = s.items.filter(
          (i) => i.status === "PENDING" || i.status === "MODIFIED"
        ).length;
        actionItems.push({
          id: s.id,
          title: s.title,
          type: "strategy",
          typeLabel: pendingItems > 0
            ? `${pendingItems} item${pendingItems > 1 ? "s" : ""} a valider`
            : "A reviser",
          href: `/portal/strategy/${s.id}`,
          since: s.updatedAt,
        });
      }
    }
    for (const d of ec.deliverables) {
      totalDeliverables++;
      if (d.status === "APPROVED" || d.status === "DELIVERED") approvedDeliverables++;
      if (d.status === "IN_REVIEW" || d.status === "REVISED") {
        actionItems.push({
          id: d.id,
          title: d.title,
          type: "deliverable",
          typeLabel: `${getDeliverableTypeLabel(d.type)} — en attente de votre validation`,
          href: `/portal/deliverables/${d.id}`,
          since: d.updatedAt,
        });
      }
    }
  }

  const hasContent = totalStrategies > 0 || totalDeliverables > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Greeting */}
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">Bonjour {firstName}</h1>
        {actionItems.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {actionItems.length} element{actionItems.length > 1 ? "s" : ""} en attente de votre validation
          </p>
        ) : hasContent ? (
          <p className="text-sm text-muted-foreground">Vous etes a jour — rien a valider pour le moment</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            L&apos;equipe Fastlane prepare votre strategie. Vous serez notifie des qu&apos;elle sera prete.
          </p>
        )}
      </div>

      {/* Action required */}
      {actionItems.length > 0 && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            <span className="text-sm font-medium">Action requise</span>
          </div>
          <div className="space-y-2">
            {actionItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center justify-between rounded-md border bg-card p-3 transition-colors hover:bg-accent group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {item.type === "strategy" ? (
                      <Target className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    ) : (
                      <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <p className="text-sm font-medium truncate group-hover:underline">{item.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 ml-[22px]">
                    {item.typeLabel} · {relativeTime(item.since)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0 ml-3" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Progression */}
      {hasContent && (
        <div className="grid gap-4 sm:grid-cols-2">
          {totalStrategies > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Strategie</span>
                <span className="text-xs text-muted-foreground">{approvedStrategies}/{totalStrategies}</span>
              </div>
              <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                  style={{
                    width: `${Math.round((approvedStrategies / totalStrategies) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
          {totalDeliverables > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Livrables</span>
                <span className="text-xs text-muted-foreground">{approvedDeliverables}/{totalDeliverables}</span>
              </div>
              <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                  style={{
                    width: `${Math.round((approvedDeliverables / totalDeliverables) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent activity */}
      {activities.length > 0 && (
        <div className="space-y-1">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Activite recente</h2>
          <div className="divide-y">
            {activities.map((activity) => {
              const isTeam = activity.user.role === "SUPER_ADMIN" || activity.user.role === "ADMIN";
              return (
                <div key={activity.id} className="flex items-start gap-3 py-2.5">
                  <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground mt-0.5"
                  >
                    {isTeam ? "F" : activity.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">
                      <span className="font-medium">
                        {isTeam ? "L'equipe Fastlane" : "Vous"}
                      </span>{" "}
                      <span className="text-muted-foreground">{activity.message}</span>
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      {relativeTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All clear state when there's content but nothing to do */}
      {hasContent && actionItems.length === 0 && activities.length === 0 && (
        <div className="flex items-center gap-3 py-8 justify-center text-muted-foreground">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <p className="text-sm">Tout est a jour — aucune action requise.</p>
        </div>
      )}
    </div>
  );
}
