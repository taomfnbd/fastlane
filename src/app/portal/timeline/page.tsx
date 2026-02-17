import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Clock, Calendar } from "lucide-react";

export const metadata = { title: "Timeline" };

export default async function PortalTimelinePage() {
  const session = await requireClient();

  const eventCompanies = await prisma.eventCompany.findMany({
    where: { companyId: session.companyId },
    include: {
      event: true,
    },
    orderBy: { event: { startDate: "desc" } },
  });

  const activities = await prisma.activity.findMany({
    where: {
      OR: [
        {
          strategy: {
            eventCompany: { companyId: session.companyId },
          },
        },
        {
          deliverable: {
            eventCompany: { companyId: session.companyId },
          },
        },
      ],
    },
    include: {
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timeline"
        description="Track your event progress"
      />

      {/* Events */}
      {eventCompanies.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No events"
          description="You are not part of any growth hacking event yet."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {eventCompanies.map((ec) => (
              <Card key={ec.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{ec.event.name}</h3>
                      {ec.event.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {ec.event.description}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={ec.event.status} />
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(ec.event.startDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    -{" "}
                    {new Date(ec.event.endDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Activity feed */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No activity yet.
                </p>
              ) : (
                <div className="relative space-y-0">
                  {activities.map((activity, i) => (
                    <div key={activity.id} className="flex gap-4 pb-6 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {activity.user.name.charAt(0)}
                        </div>
                        {i < activities.length - 1 && (
                          <div className="w-px flex-1 bg-border mt-1" />
                        )}
                      </div>
                      <div className="pt-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user.name}</span>{" "}
                          {activity.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
