import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isAdmin } from "@/lib/auth-server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [
    strategiesByStatus,
    deliverablesByStatus,
    deliverablesByType,
    activeEventsCount,
    approvedStrategies,
    activities,
    topCompaniesRaw,
  ] = await Promise.all([
    prisma.strategy.groupBy({ by: ["status"], _count: true }),
    prisma.deliverable.groupBy({ by: ["status"], _count: true }),
    prisma.deliverable.groupBy({ by: ["type"], _count: true }),
    prisma.event.count({ where: { status: "ACTIVE" } }),
    prisma.strategy.findMany({
      where: { status: "APPROVED" },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.activity.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
    prisma.eventCompany.findMany({
      include: {
        company: { select: { id: true, name: true } },
        strategies: { where: { status: "APPROVED" }, select: { id: true } },
        deliverables: {
          where: { status: { in: ["APPROVED", "DELIVERED"] } },
          select: { id: true },
        },
      },
    }),
  ]);

  // Approval rate: approved strategies / total non-draft strategies
  const totalNonDraftStrategies = strategiesByStatus
    .filter((g) => g.status !== "DRAFT")
    .reduce((sum, g) => sum + g._count, 0);
  const approvedStrategyCount = strategiesByStatus
    .filter((g) => g.status === "APPROVED")
    .reduce((sum, g) => sum + g._count, 0);
  const approvalRate =
    totalNonDraftStrategies > 0
      ? Math.round((approvedStrategyCount / totalNonDraftStrategies) * 100)
      : 0;

  // Delivery rate: delivered deliverables / total non-draft deliverables
  const totalNonDraftDeliverables = deliverablesByStatus
    .filter((g) => g.status !== "DRAFT")
    .reduce((sum, g) => sum + g._count, 0);
  const deliveredCount = deliverablesByStatus
    .filter((g) => g.status === "DELIVERED")
    .reduce((sum, g) => sum + g._count, 0);
  const deliveryRate =
    totalNonDraftDeliverables > 0
      ? Math.round((deliveredCount / totalNonDraftDeliverables) * 100)
      : 0;

  // Average review time: time between strategy creation and approval (updatedAt for approved)
  const reviewTimes = approvedStrategies.map((s) => {
    const created = new Date(s.createdAt).getTime();
    const updated = new Date(s.updatedAt).getTime();
    return (updated - created) / (1000 * 60 * 60 * 24);
  });
  const avgReviewTime =
    reviewTimes.length > 0
      ? Math.round(
          (reviewTimes.reduce((sum, t) => sum + t, 0) / reviewTimes.length) * 10
        ) / 10
      : 0;

  // Monthly activity: group activities by month for last 6 months
  const monthlyMap = new Map<string, number>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, 0);
  }

  for (const a of activities) {
    const d = new Date(a.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap.has(key)) {
      monthlyMap.set(key, monthlyMap.get(key)! + 1);
    }
  }

  const monthNames = [
    "Jan", "Fev", "Mar", "Avr", "Mai", "Juin",
    "Juil", "Aout", "Sep", "Oct", "Nov", "Dec",
  ];

  const monthlyActivity = Array.from(monthlyMap.entries()).map(
    ([key, count]) => {
      const [year, month] = key.split("-");
      return {
        month: `${monthNames[parseInt(month, 10) - 1]} ${year}`,
        count,
      };
    }
  );

  // Status breakdown for strategies
  const statusBreakdown = strategiesByStatus.map((g) => ({
    status: g.status,
    count: g._count,
  }));

  // Deliverables by type
  const deliverablesByTypeFormatted = deliverablesByType.map((g) => ({
    type: g.type,
    count: g._count,
  }));

  // Top 5 companies by total approved items (strategies + deliverables)
  const companyTotals = new Map<
    string,
    { id: string; name: string; approved: number }
  >();

  for (const ec of topCompaniesRaw) {
    const existing = companyTotals.get(ec.company.id);
    const approved = ec.strategies.length + ec.deliverables.length;
    if (existing) {
      existing.approved += approved;
    } else {
      companyTotals.set(ec.company.id, {
        id: ec.company.id,
        name: ec.company.name,
        approved,
      });
    }
  }

  const topCompanies = Array.from(companyTotals.values())
    .sort((a, b) => b.approved - a.approved)
    .slice(0, 5);

  return NextResponse.json({
    approvalRate,
    deliveryRate,
    avgReviewTime,
    activeEventsCount,
    monthlyActivity,
    statusBreakdown,
    deliverablesByType: deliverablesByTypeFormatted,
    topCompanies,
  });
}
