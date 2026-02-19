import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  const [user, notifications, pendingStrategies, pendingDeliverables] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    }),
    prisma.notification.findMany({
      where: { userId: session.user.id },
      take: 10,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, message: true, link: true, read: true, createdAt: true },
    }),
    prisma.strategy.count({ where: { status: { in: ["PENDING_REVIEW", "CHANGES_REQUESTED"] } } }),
    prisma.deliverable.count({ where: { status: { in: ["IN_REVIEW", "CHANGES_REQUESTED"] } } }),
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const serializedNotifications = notifications.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <AdminShell
      user={{
        name: user?.name ?? session.user.name,
        email: user?.email ?? session.user.email,
      }}
      notifications={serializedNotifications}
      unreadCount={unreadCount}
      pendingCounts={{ pendingStrategies, pendingDeliverables }}
    >
      {children}
    </AdminShell>
  );
}
