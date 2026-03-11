import { prisma } from "@/lib/prisma";
import { relativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const typeConfig: Record<string, { label: string; color: string }> = {
  STRATEGY_CREATED: { label: "Cree", color: "bg-blue-500" },
  STRATEGY_UPDATED: { label: "Modifie", color: "bg-muted-foreground" },
  STRATEGY_SUBMITTED: { label: "Soumis pour review", color: "bg-amber-500" },
  STRATEGY_APPROVED: { label: "Approuve", color: "bg-emerald-500" },
  STRATEGY_REJECTED: { label: "Modifications demandees", color: "bg-red-500" },
  DELIVERABLE_CREATED: { label: "Cree", color: "bg-blue-500" },
  DELIVERABLE_SUBMITTED: { label: "Soumis pour review", color: "bg-amber-500" },
  DELIVERABLE_APPROVED: { label: "Approuve", color: "bg-emerald-500" },
  DELIVERABLE_REJECTED: { label: "Modifications demandees", color: "bg-red-500" },
  COMMENT_ADDED: { label: "Commentaire", color: "bg-muted-foreground" },
  STATUS_CHANGED: { label: "Statut modifie", color: "bg-muted-foreground" },
  FILE_UPLOADED: { label: "Fichier uploade", color: "bg-blue-500" },
};

interface ActivityTimelineProps {
  strategyId?: string;
  deliverableId?: string;
}

export async function ActivityTimeline({ strategyId, deliverableId }: ActivityTimelineProps) {
  const where = strategyId ? { strategyId } : deliverableId ? { deliverableId } : null;
  if (!where) return null;

  const activities = await prisma.activity.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { user: { select: { name: true } } },
  });

  if (activities.length === 0) return null;

  return (
    <div>
      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Historique</h2>
      <div className="rounded-xl border p-3">
        <div className="space-y-0">
          {activities.map((activity, i) => {
            const config = typeConfig[activity.type] ?? { label: activity.type, color: "bg-muted-foreground" };
            return (
              <div key={activity.id} className="flex gap-3 py-2">
                <div className="flex flex-col items-center">
                  <div className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", config.color)} />
                  {i < activities.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                </div>
                <div className="min-w-0 pb-2">
                  <p className="text-xs">
                    <span className="font-medium">{activity.user.name}</span>{" "}
                    <span className="text-muted-foreground">{activity.message ?? config.label}</span>
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
    </div>
  );
}
