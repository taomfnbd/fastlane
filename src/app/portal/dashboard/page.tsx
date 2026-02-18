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
import { ProgressRing } from "@/components/portal/progress-ring";

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

  type ActionItem = {
    id: string;
    title: string;
    type: "strategy" | "deliverable";
    typeLabel: string;
    href: string;
    since: Date;
  };

  const actionItems: ActionItem[] = [];

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
          typeLabel: getDeliverableTypeLabel(d.type),
          href: `/portal/deliverables/${d.id}`,
          since: d.updatedAt,
        });
      }
    }
  }

  const hasContent = totalStrategies > 0 || totalDeliverables > 0;

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Greeting */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Bonjour {firstName}</h1>
        {actionItems.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {actionItems.length} element{actionItems.length > 1 ? "s" : ""} en attente
          </p>
        ) : hasContent ? (
          <p className="text-sm text-muted-foreground">Vous etes a jour — rien a valider pour le moment</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            L&apos;equipe Fastlane prepare votre strategie. Vous serez notifie des qu&apos;elle sera prete.
          </p>
        )}
      </div>

      {/* Progress rings */}
      {hasContent && (
        <div className="grid grid-cols-2 gap-4">
          {totalStrategies > 0 && (
            <div className="flex items-center gap-4 rounded-xl bg-card/50 p-5">
              <ProgressRing value={approvedStrategies} max={totalStrategies} />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Strategies</p>
                <p className="text-sm font-medium mt-0.5">
                  {approvedStrategies} sur {totalStrategies} validee{totalStrategies > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}
          {totalDeliverables > 0 && (
            <div className="flex items-center gap-4 rounded-xl bg-card/50 p-5">
              <ProgressRing value={approvedDeliverables} max={totalDeliverables} />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Livrables</p>
                <p className="text-sm font-medium mt-0.5">
                  {approvedDeliverables} sur {totalDeliverables} valide{totalDeliverables > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action queue */}
      {actionItems.length > 0 && (
        <div>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
            File d&apos;attente
          </h2>
          <div className="rounded-xl bg-card/50 overflow-hidden divide-y divide-border/50">
            {actionItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-accent/50 ring-1 ring-amber-500/10"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                </span>
                {item.type === "strategy" ? (
                  <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate group-hover:underline decoration-muted-foreground/30 underline-offset-2">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.typeLabel} · {relativeTime(item.since)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* All clear */}
      {hasContent && actionItems.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          <p className="text-sm font-medium">Tout est a jour</p>
          <p className="text-xs text-muted-foreground">Aucune action requise de votre part</p>
        </div>
      )}

      {/* Recent activity */}
      {activities.length > 0 && (
        <div>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
            Activite recente
          </h2>
          <div className="divide-y divide-border/50">
            {activities.map((activity) => {
              const isTeam = activity.user.role === "SUPER_ADMIN" || activity.user.role === "ADMIN";
              return (
                <div key={activity.id} className="flex items-start gap-3 py-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground mt-0.5">
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
    </div>
  );
}
