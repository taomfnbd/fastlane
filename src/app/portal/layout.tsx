import { requireClient } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { PortalSidebar, PortalTopbar } from "@/components/portal/portal-sidebar";
import { redirect } from "next/navigation";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireClient();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      company: { select: { name: true } },
    },
  });

  if (!user?.company) {
    redirect("/login");
  }

  const notificationCount = await prisma.notification.count({
    where: { userId: session.user.id, read: false },
  });

  return (
    <div className="min-h-screen">
      <PortalSidebar
        user={{
          name: user.name,
          email: user.email,
          image: user.image,
        }}
        companyName={user.company.name}
        notificationCount={notificationCount}
      />
      <div className="lg:pl-64">
        <PortalTopbar notificationCount={notificationCount} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
