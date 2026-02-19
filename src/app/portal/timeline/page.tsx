import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { relativeTime } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { EMPTY_STATES } from "@/lib/portal-constants";
import { Clock, Target, Package, MessageSquare, FileText, ChevronRight } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Activite" };

const activityIcons: Record<string, typeof Target> = {
  STRATEGY_CREATED: Target,
  STRATEGY_UPDATED: Target,
  STRATEGY_SUBMITTED: Target,
  STRATEGY_APPROVED: Target,
  STRATEGY_REJECTED: Target,
  DELIVERABLE_CREATED: Package,
  DELIVERABLE_SUBMITTED: Package,
  DELIVERABLE_APPROVED: Package,
  DELIVERABLE_REJECTED: Package,
  COMMENT_ADDED: MessageSquare,
  STATUS_CHANGED: Clock,
  FILE_UPLOADED: FileText,
};

export default async function PortalTimelinePage() {
  const session = await requireClient();

  const activities = await prisma.activity.findMany({
    where: {
      OR: [
        { strategy: { eventCompany: { companyId: session.companyId } } },
        { deliverable: { eventCompany: { companyId: session.companyId } } },
      ],
    },
    include: {
      user: { select: { name: true, role: true } },
      strategy: { select: { id: true, title: true } },
      deliverable: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="space-y-1">
        <h1 className="text-lg sm:text-xl font-semibold tracking-tight">Activite</h1>
        <p className="text-sm text-muted-foreground">Historique des actions sur vos strategies et livrables</p>
      </div>

      {activities.length === 0 ? (
        <EmptyState
          icon={Clock}
          title={EMPTY_STATES.timeline.title}
          description={EMPTY_STATES.timeline.description}
        />
      ) : (
        <div className="space-y-1">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type] ?? Clock;
            const isTeam = activity.user.role === "SUPER_ADMIN" || activity.user.role === "ADMIN";
            const href = activity.strategy
              ? `/portal/strategy/${activity.strategy.id}`
              : activity.deliverable
                ? `/portal/deliverables/${activity.deliverable.id}`
                : null;

            const inner = (
              <div className="flex items-start gap-3 px-3 py-3 rounded-lg transition-colors hover:bg-accent/50 group">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted mt-0.5">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{isTeam ? "L'equipe Fastlane" : "Vous"}</span>{" "}
                    <span className="text-muted-foreground">{activity.message}</span>
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    {relativeTime(activity.createdAt)}
                  </p>
                </div>
                {href && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 transition-transform group-hover:translate-x-0.5" />
                )}
              </div>
            );

            return href ? (
              <Link key={activity.id} href={href}>
                {inner}
              </Link>
            ) : (
              <div key={activity.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
