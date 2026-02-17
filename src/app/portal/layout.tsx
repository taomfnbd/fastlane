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
      company: { select: { id: true, name: true } },
    },
  });

  if (!user?.company) {
    redirect("/login");
  }

  const [notificationCount, eventCompanies] = await Promise.all([
    prisma.notification.count({
      where: { userId: session.user.id, read: false },
    }),
    prisma.eventCompany.findMany({
      where: { companyId: user.company.id },
      include: {
        event: { select: { name: true, status: true } },
        strategies: {
          where: { status: { in: ["PENDING_REVIEW", "REVISED"] } },
          select: { id: true },
        },
        deliverables: {
          where: { status: { in: ["IN_REVIEW", "REVISED"] } },
          select: { id: true },
        },
      },
    }),
  ]);

  const activeEvent = eventCompanies.find((ec) => ec.event.status === "ACTIVE");
  const pendingStrategies = eventCompanies.reduce((sum, ec) => sum + ec.strategies.length, 0);
  const pendingDeliverables = eventCompanies.reduce((sum, ec) => sum + ec.deliverables.length, 0);

  return (
    <PortalShell
      user={{
        name: user.name,
        email: user.email,
      }}
      companyName={user.company.name}
      activeEventName={activeEvent?.event.name ?? null}
      notificationCount={notificationCount}
      pendingStrategies={pendingStrategies}
      pendingDeliverables={pendingDeliverables}
    >
      {children}
    </PortalShell>
  );
}
