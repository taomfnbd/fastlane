import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    take: 10,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      message: true,
      link: true,
      read: true,
      createdAt: true,
    },
  });

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
    >
      {children}
    </AdminShell>
  );
}
