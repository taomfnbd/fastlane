import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { AdminSidebar, AdminTopbar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, image: true, role: true },
  });

  const notificationCount = await prisma.notification.count({
    where: { userId: session.user.id, read: false },
  });

  return (
    <div className="min-h-screen">
      <AdminSidebar
        user={{
          name: user?.name ?? session.user.name,
          email: user?.email ?? session.user.email,
          image: user?.image,
          role: user?.role ?? "ADMIN",
        }}
        notificationCount={notificationCount}
      />
      <div className="lg:pl-64">
        <AdminTopbar notificationCount={notificationCount} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
