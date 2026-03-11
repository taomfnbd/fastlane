import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  await requireAdmin();

  const q = request.nextUrl.searchParams.get("q")?.trim().slice(0, 100);
  if (!q || q.length < 2) {
    return NextResponse.json({
      events: [],
      companies: [],
      strategies: [],
      deliverables: [],
      users: [],
    });
  }

  const contains = { contains: q, mode: "insensitive" as const };

  const [events, companies, strategies, deliverables, users] = await Promise.all([
    prisma.event.findMany({
      where: { OR: [{ name: contains }, { description: contains }] },
      take: 5,
      select: { id: true, name: true, status: true },
      orderBy: { startDate: "desc" },
    }),
    prisma.company.findMany({
      where: { OR: [{ name: contains }, { industry: contains }, { description: contains }] },
      take: 5,
      select: { id: true, name: true, industry: true },
      orderBy: { name: "asc" },
    }),
    prisma.strategy.findMany({
      where: { OR: [{ title: contains }, { description: contains }] },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        eventCompany: {
          select: {
            event: { select: { id: true, name: true } },
            company: { select: { name: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.deliverable.findMany({
      where: { OR: [{ title: contains }, { description: contains }] },
      take: 5,
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        dueDate: true,
        eventCompany: {
          select: {
            event: { select: { id: true, name: true } },
            company: { select: { name: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.user.findMany({
      where: { OR: [{ name: contains }, { email: contains }] },
      take: 5,
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({
    events,
    companies,
    strategies,
    deliverables,
    users,
  });
}
