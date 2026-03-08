import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { ActivityFilter } from "@/components/admin/activity-filter";
import { Send, Check, XCircle, MessageSquare, FileUp, RefreshCw, Target, Package, Calendar } from "lucide-react";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Activite" };

const activityIcons: Record<string, typeof Target> = {
  STRATEGY_CREATED: Target,
  STRATEGY_UPDATED: Target,
  STRATEGY_SUBMITTED: Send,
  STRATEGY_APPROVED: Check,
  STRATEGY_REJECTED: XCircle,
  DELIVERABLE_CREATED: Package,
  DELIVERABLE_SUBMITTED: Send,
  DELIVERABLE_APPROVED: Check,
  DELIVERABLE_REJECTED: XCircle,
  COMMENT_ADDED: MessageSquare,
  STATUS_CHANGED: RefreshCw,
  FILE_UPLOADED: FileUp,
};

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string; user?: string; event?: string }>;
}) {
  await requireAdmin();
  const { page = "1", type, user, event } = await searchParams;
  const currentPage = Math.max(1, Number(page));
  const perPage = 20;

  const where: Prisma.ActivityWhereInput = {};
  if (type) where.type = type as Prisma.ActivityWhereInput["type"];
  if (user) where.userId = user;
  if (event) {
    where.OR = [
      { strategy: { eventCompany: { eventId: event } } },
      { deliverable: { eventCompany: { eventId: event } } },
    ];
  }

  const [activities, totalCount, users, events] = await Promise.all([
    prisma.activity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * perPage,
      take: perPage,
      include: {
        user: { select: { name: true, image: true } },
        strategy: { select: { id: true, title: true, eventCompany: { select: { eventId: true } } } },
        deliverable: { select: { id: true, title: true, eventCompany: { select: { eventId: true } } } },
      },
    }),
    prisma.activity.count({ where }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.event.findMany({ select: { id: true, name: true }, orderBy: { startDate: "desc" } }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title="Activite" />
      <ActivityFilter users={users} events={events} />
      {activities.length === 0 ? (
        <p className="text-xs text-muted-foreground py-8 text-center">Aucune activite.</p>
      ) : (
        <div className="space-y-0">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type] ?? RefreshCw;
            const href = activity.strategy?.eventCompany?.eventId
              ? `/admin/events/${activity.strategy.eventCompany.eventId}/strategy`
              : activity.deliverable?.eventCompany?.eventId
                ? `/admin/events/${activity.deliverable.eventCompany.eventId}/deliverables`
                : null;
            const target = activity.strategy?.title ?? activity.deliverable?.title;

            return (
              <div key={activity.id} className="flex items-start gap-3 py-3 border-b last:border-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted mt-0.5">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user.name}</span>{" "}
                    <span className="text-muted-foreground">{activity.message}</span>
                  </p>
                  {target && href && (
                    <Link href={href} className="text-xs text-primary hover:underline">{target}</Link>
                  )}
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                    {new Date(activity.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Pagination total={totalCount} perPage={perPage} basePath="/admin/activity" />
    </div>
  );
}
