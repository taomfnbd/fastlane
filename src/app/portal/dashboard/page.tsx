import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { WelcomeBanner } from "@/components/portal/welcome-banner";
import { getDeliverableTypeLabel } from "@/lib/portal-constants";
import {
  Target,
  Package,
  Bell,
  CheckCircle2,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Tableau de bord" };

export default async function PortalDashboardPage() {
  const session = await requireClient();

  const eventCompanies = await prisma.eventCompany.findMany({
    where: { companyId: session.companyId },
    include: {
      event: true,
      strategies: {
        where: { status: { not: "DRAFT" } },
        select: {
          id: true,
          status: true,
          title: true,
          updatedAt: true,
          items: { select: { status: true } },
          _count: { select: { comments: true } },
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
          _count: { select: { comments: true } },
        },
      },
    },
    orderBy: { event: { startDate: "desc" } },
  });

  const activeEvent = eventCompanies.find((ec) => ec.event.status === "ACTIVE");

  // Compute active event progress
  let activeEventProgress = 0;
  if (activeEvent) {
    const allStrategies = activeEvent.strategies;
    const allDeliverables = activeEvent.deliverables;
    const totalItems = allStrategies.length + allDeliverables.length;
    if (totalItems > 0) {
      const doneStrategies = allStrategies.filter((s) => s.status === "APPROVED").length;
      const doneDeliverables = allDeliverables.filter(
        (d) => d.status === "APPROVED" || d.status === "DELIVERED"
      ).length;
      activeEventProgress = Math.round(((doneStrategies + doneDeliverables) / totalItems) * 100);
    }
  }

  // Build action items (things requiring client attention)
  type ActionItem = {
    id: string;
    title: string;
    type: "strategy" | "deliverable";
    typeLabel: string;
    href: string;
    commentCount: number;
  };

  const actionItems: ActionItem[] = [];

  for (const ec of eventCompanies) {
    for (const s of ec.strategies) {
      if (s.status === "PENDING_REVIEW" || s.status === "REVISED") {
        actionItems.push({
          id: s.id,
          title: s.title,
          type: "strategy",
          typeLabel: "Strategie a reviser",
          href: `/portal/strategy/${s.id}`,
          commentCount: s._count.comments,
        });
      }
    }
    for (const d of ec.deliverables) {
      if (d.status === "IN_REVIEW" || d.status === "REVISED") {
        actionItems.push({
          id: d.id,
          title: d.title,
          type: "deliverable",
          typeLabel: `${getDeliverableTypeLabel(d.type)} a valider`,
          href: `/portal/deliverables/${d.id}`,
          commentCount: d._count.comments,
        });
      }
    }
  }

  const recentNotifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  const unreadCount = recentNotifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Tableau de bord" />

      <WelcomeBanner />

      {/* Active event hero */}
      {activeEvent && (
        <div className="rounded-md border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Evenement en cours
              </p>
              <p className="text-lg font-semibold mt-0.5">{activeEvent.event.name}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums">{activeEventProgress}%</p>
              <p className="text-[11px] text-muted-foreground">progression</p>
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted mt-3">
            <div
              className="h-1.5 rounded-full bg-emerald-500 transition-all"
              style={{ width: `${activeEventProgress}%` }}
            />
          </div>
          {activeEvent.event.endDate && (
            <p className="text-[11px] text-muted-foreground mt-2">
              Fin prevue le{" "}
              {new Date(activeEvent.event.endDate).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Action items */}
        <div>
          <h2 className="text-sm font-medium mb-3">A faire</h2>
          {actionItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center rounded-md border border-dashed">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              <p className="mt-2 text-sm font-medium">Tout est a jour</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Aucune action requise de votre part pour le moment.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {actionItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center justify-between rounded-md border border-l-4 border-l-amber-400 px-3 py-2.5 hover:bg-accent/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        {item.type === "strategy" ? (
                          <Target className="h-3 w-3" />
                        ) : (
                          <Package className="h-3 w-3" />
                        )}
                        {item.typeLabel}
                      </span>
                      {item.commentCount > 0 && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {item.commentCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium">Notifications</h2>
            {unreadCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Bell className="h-3 w-3" />
                {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          {recentNotifications.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Aucune notification.</p>
          ) : (
            <div className="space-y-0">
              {recentNotifications.map((notification) => {
                const content = (
                  <>
                    <div
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                        notification.read ? "bg-muted-foreground/20" : "bg-blue-500"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
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
                  </>
                );

                return notification.link ? (
                  <Link
                    key={notification.id}
                    href={notification.link}
                    className="flex items-start gap-2.5 py-2 rounded-md -mx-1 px-1 hover:bg-accent/50 transition-colors"
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={notification.id} className="flex items-start gap-2.5 py-2">
                    {content}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
