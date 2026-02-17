import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { getDeliverableTypeLabel } from "@/lib/portal-constants";
import { relativeTime } from "@/lib/utils";
import {
  Target,
  Package,
  CheckCircle2,
  ArrowRight,
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
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-lg font-semibold">Bonjour {firstName}</h1>
        {actionItems.length > 0 ? (
          <p className="text-sm text-muted-foreground mt-0.5">
            {actionItems.length} element{actionItems.length > 1 ? "s" : ""} necessite{actionItems.length > 1 ? "nt" : ""} votre attention
          </p>
        ) : hasContent ? (
          <p className="text-sm text-muted-foreground mt-0.5">Tout est a jour.</p>
        ) : (
          <p className="text-sm text-muted-foreground mt-0.5">
            L&apos;equipe Fastlane prepare votre strategie. Vous serez notifie des qu&apos;elle sera prete pour review.
          </p>
        )}
      </div>

      {/* Action required */}
      {actionItems.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Action requise
          </h2>
          <div className="space-y-2">
            {actionItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center justify-between rounded-md border border-l-4 border-l-amber-500 px-4 py-3 hover:bg-accent/50 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {item.type === "strategy" ? (
                      <Target className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    ) : (
                      <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <p className="text-sm font-medium truncate">{item.title}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 ml-5.5">
                    {item.typeLabel} · Soumis {relativeTime(item.since)}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors shrink-0 ml-3 flex items-center gap-1">
                  Voir et valider
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Progression */}
      {hasContent && (
        <div>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Progression
          </h2>
          <div className="space-y-3">
            {totalStrategies > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm w-24 shrink-0">Strategie</span>
                <div className="flex-1 h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.round((approvedStrategies / totalStrategies) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-sm text-muted-foreground tabular-nums w-20 text-right shrink-0">
                  {approvedStrategies}/{totalStrategies} valide{approvedStrategies > 1 ? "s" : ""}
                </span>
              </div>
            )}
            {totalDeliverables > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm w-24 shrink-0">Livrables</span>
                <div className="flex-1 h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.round((approvedDeliverables / totalDeliverables) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-sm text-muted-foreground tabular-nums w-20 text-right shrink-0">
                  {approvedDeliverables}/{totalDeliverables} valide{approvedDeliverables > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {activities.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Activite recente
          </h2>
          <div className="space-y-0">
            {activities.map((activity) => {
              const isTeam = activity.user.role === "SUPER_ADMIN" || activity.user.role === "ADMIN";
              return (
                <div key={activity.id} className="flex items-start gap-3 py-2">
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium mt-0.5 ${
                      isTeam ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isTeam ? "F" : activity.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs">
                      <span className="font-medium">
                        {isTeam ? "L'equipe Fastlane" : "Vous"}
                      </span>{" "}
                      <span className="text-muted-foreground">{activity.message}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">
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
