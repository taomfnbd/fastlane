import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { EMPTY_STATES } from "@/lib/portal-constants";
import { Clock, Calendar } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Activite" };

export default async function PortalTimelinePage() {
  const session = await requireClient();

  const eventCompanies = await prisma.eventCompany.findMany({
    where: { companyId: session.companyId },
    include: { event: true },
    orderBy: { event: { startDate: "desc" } },
  });

  const activities = await prisma.activity.findMany({
    where: {
      OR: [
        { strategy: { eventCompany: { companyId: session.companyId } } },
        { deliverable: { eventCompany: { companyId: session.companyId } } },
      ],
    },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  function getActivityLink(activity: { strategyId: string | null; deliverableId: string | null }) {
    if (activity.strategyId) return `/portal/strategy/${activity.strategyId}`;
    if (activity.deliverableId) return `/portal/deliverables/${activity.deliverableId}`;
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Activite" />

      {eventCompanies.length === 0 ? (
        <EmptyState
          icon={Clock}
          title={EMPTY_STATES.timeline.title}
          description={EMPTY_STATES.timeline.description}
        />
      ) : (
        <>
          {/* Events */}
          <div className="rounded-md border divide-y">
            {eventCompanies.map((ec) => (
              <div key={ec.id} className="px-3 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{ec.event.name}</p>
                  <StatusBadge status={ec.event.status} />
                </div>
                {ec.event.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{ec.event.description}</p>
                )}
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(ec.event.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  {" — "}
                  {new Date(ec.event.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
            ))}
          </div>

          {/* Activity feed */}
          <div>
            <h2 className="text-sm font-medium mb-3">Activite recente</h2>
            {activities.length === 0 ? (
              <EmptyState
                icon={Clock}
                title={EMPTY_STATES.timeline.title}
                description={EMPTY_STATES.timeline.description}
              />
            ) : (
              <div className="relative">
                {activities.map((activity, i) => {
                  const link = getActivityLink(activity);
                  const content = (
                    <>
                      <div className="flex flex-col items-center">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                          {activity.user.name.charAt(0)}
                        </div>
                        {i < activities.length - 1 && (
                          <div className="w-px flex-1 bg-border mt-1" />
                        )}
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-xs">
                          <span className="font-medium">{activity.user.name}</span>{" "}
                          <span className="text-muted-foreground">{activity.message}</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                          {new Date(activity.createdAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </>
                  );

                  return link ? (
                    <Link
                      key={activity.id}
                      href={link}
                      className="flex gap-3 pb-4 last:pb-0 rounded-md -mx-1 px-1 hover:bg-accent/50 transition-colors"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={activity.id} className="flex gap-3 pb-4 last:pb-0">
                      {content}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
