import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Calendar, Building2, Package, Target } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [
    activeEventsCount,
    totalCompanies,
    pendingDeliverables,
    pendingStrategies,
    recentEvents,
    recentActivities,
  ] = await Promise.all([
    prisma.event.count({ where: { status: "ACTIVE" } }),
    prisma.company.count(),
    prisma.deliverable.count({ where: { status: "IN_REVIEW" } }),
    prisma.strategy.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.event.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: { companies: { include: { company: true } } },
    }),
    prisma.activity.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, image: true } } },
    }),
  ]);

  const stats = [
    {
      label: "Active Events",
      value: activeEventsCount,
      icon: Calendar,
      href: "/admin/events",
    },
    {
      label: "Total Companies",
      value: totalCompanies,
      icon: Building2,
      href: "/admin/companies",
    },
    {
      label: "Deliverables to Review",
      value: pendingDeliverables,
      icon: Package,
      href: "/admin/events",
    },
    {
      label: "Strategies Pending",
      value: pendingStrategies,
      icon: Target,
      href: "/admin/events",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your growth hacking events"
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No events yet. Create your first event to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {recentEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/admin/events/${event.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{event.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.companies.length} companies
                      </p>
                    </div>
                    <StatusBadge status={event.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No activity yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 text-sm"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {activity.user.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p>
                        <span className="font-medium">{activity.user.name}</span>{" "}
                        {activity.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
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
      </div>
    </div>
  );
}
