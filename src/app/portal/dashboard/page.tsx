import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Target, Package, Clock, MessageSquare } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Dashboard" };

export default async function PortalDashboardPage() {
  const session = await requireClient();

  const eventCompanies = await prisma.eventCompany.findMany({
    where: { companyId: session.companyId },
    include: {
      event: true,
      strategies: { select: { id: true, status: true, title: true, updatedAt: true } },
      deliverables: { select: { id: true, status: true, title: true, type: true, updatedAt: true } },
    },
    orderBy: { event: { startDate: "desc" } },
  });

  const activeEvent = eventCompanies.find((ec) => ec.event.status === "ACTIVE");

  const totalStrategies = eventCompanies.reduce((sum, ec) => sum + ec.strategies.length, 0);
  const pendingStrategies = eventCompanies.reduce(
    (sum, ec) => sum + ec.strategies.filter((s) => s.status === "PENDING_REVIEW").length,
    0
  );
  const totalDeliverables = eventCompanies.reduce((sum, ec) => sum + ec.deliverables.length, 0);
  const pendingDeliverables = eventCompanies.reduce(
    (sum, ec) => sum + ec.deliverables.filter((d) => d.status === "IN_REVIEW").length,
    0
  );

  const recentNotifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  const stats = [
    {
      label: "Strategies",
      value: totalStrategies,
      sub: `${pendingStrategies} to review`,
      icon: Target,
      href: "/portal/strategy",
    },
    {
      label: "Deliverables",
      value: totalDeliverables,
      sub: `${pendingDeliverables} to review`,
      icon: Package,
      href: "/portal/deliverables",
    },
    {
      label: "Current Event",
      value: activeEvent?.event.name ?? "None",
      sub: activeEvent
        ? `${new Date(activeEvent.event.startDate).toLocaleDateString()} - ${new Date(activeEvent.event.endDate).toLocaleDateString()}`
        : "No active event",
      icon: Clock,
      href: "/portal/timeline",
    },
    {
      label: "Notifications",
      value: recentNotifications.filter((n) => !n.read).length,
      sub: "unread",
      icon: MessageSquare,
      href: "/portal/dashboard",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Your growth hacking overview"
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
                <div className="text-2xl font-bold truncate">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Items to Review</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingStrategies === 0 && pendingDeliverables === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nothing to review right now.
              </p>
            ) : (
              <div className="space-y-3">
                {eventCompanies.flatMap((ec) =>
                  ec.strategies
                    .filter((s) => s.status === "PENDING_REVIEW")
                    .map((s) => (
                      <Link
                        key={s.id}
                        href={`/portal/strategy/${s.id}`}
                        className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-sm">{s.title}</p>
                          <p className="text-xs text-muted-foreground">Strategy</p>
                        </div>
                        <StatusBadge status={s.status} />
                      </Link>
                    ))
                )}
                {eventCompanies.flatMap((ec) =>
                  ec.deliverables
                    .filter((d) => d.status === "IN_REVIEW")
                    .map((d) => (
                      <Link
                        key={d.id}
                        href={`/portal/deliverables/${d.id}`}
                        className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-sm">{d.title}</p>
                          <p className="text-xs text-muted-foreground">{d.type.replace(/_/g, " ")}</p>
                        </div>
                        <StatusBadge status={d.status} />
                      </Link>
                    ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {recentNotifications.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No notifications yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <div
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                        notification.read ? "bg-muted" : "bg-primary"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.createdAt).toLocaleDateString("en-US", {
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
