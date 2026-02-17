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

  const notificationCount = await prisma.notification.count({
    where: { userId: session.user.id, read: false },
  });

  return (
    <AdminShell
      user={{
        name: user?.name ?? session.user.name,
        email: user?.email ?? session.user.email,
      }}
      notificationCount={notificationCount}
    >
      {children}
    </AdminShell>
  );
}
