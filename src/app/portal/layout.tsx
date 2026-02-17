import { requireClient } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { PortalShell } from "@/components/portal/portal-shell";
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
    <PortalShell
      user={{
        name: user.name,
        email: user.email,
      }}
      companyName={user.company.name}
      notificationCount={notificationCount}
    >
      {children}
    </PortalShell>
  );
}
