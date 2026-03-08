"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

interface SearchResult {
  id: string;
  type: "event" | "company" | "strategy" | "deliverable" | "user";
  title: string;
  subtitle: string;
  href: string;
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  await requireAdmin();

  if (!query || query.length < 2) return [];

  const q = query.trim();
  const contains = { contains: q, mode: "insensitive" as const };

  const [events, companies, strategies, deliverables, users] = await Promise.all([
    prisma.event.findMany({
      where: { OR: [{ name: contains }, { description: contains }] },
      take: 5,
      select: { id: true, name: true, status: true },
    }),
    prisma.company.findMany({
      where: { OR: [{ name: contains }, { industry: contains }, { description: contains }] },
      take: 5,
      select: { id: true, name: true, industry: true },
    }),
    prisma.strategy.findMany({
      where: { OR: [{ title: contains }, { description: contains }] },
      take: 5,
      select: {
        id: true, title: true,
        eventCompany: { select: { event: { select: { id: true, name: true } }, company: { select: { name: true } } } },
      },
    }),
    prisma.deliverable.findMany({
      where: { OR: [{ title: contains }, { description: contains }] },
      take: 5,
      select: {
        id: true, title: true, type: true,
        eventCompany: { select: { event: { select: { id: true, name: true } }, company: { select: { name: true } } } },
      },
    }),
    prisma.user.findMany({
      where: { OR: [{ name: contains }, { email: contains }] },
      take: 5,
      select: { id: true, name: true, email: true },
    }),
  ]);

  const results: SearchResult[] = [
    ...events.map((e) => ({
      id: e.id,
      type: "event" as const,
      title: e.name,
      subtitle: e.status.toLowerCase(),
      href: `/admin/events/${e.id}`,
    })),
    ...companies.map((c) => ({
      id: c.id,
      type: "company" as const,
      title: c.name,
      subtitle: c.industry ?? "",
      href: `/admin/companies/${c.id}`,
    })),
    ...strategies.map((s) => ({
      id: s.id,
      type: "strategy" as const,
      title: s.title,
      subtitle: `${s.eventCompany.company.name} · ${s.eventCompany.event.name}`,
      href: `/admin/events/${s.eventCompany.event.id}/strategy`,
    })),
    ...deliverables.map((d) => ({
      id: d.id,
      type: "deliverable" as const,
      title: d.title,
      subtitle: `${d.eventCompany.company.name} · ${d.eventCompany.event.name}`,
      href: `/admin/events/${d.eventCompany.event.id}/deliverables`,
    })),
    ...users.map((u) => ({
      id: u.id,
      type: "user" as const,
      title: u.name,
      subtitle: u.email,
      href: `/admin/users`,
    })),
  ];

  return results;
}

export async function resolveEntityNames(ids: string[]): Promise<Record<string, string>> {
  await requireAdmin();
  if (ids.length === 0) return {};

  const [events, companies, strategies, deliverables] = await Promise.all([
    prisma.event.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
    prisma.company.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
    prisma.strategy.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } }),
    prisma.deliverable.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } }),
  ]);

  const map: Record<string, string> = {};
  for (const e of events) map[e.id] = e.name;
  for (const c of companies) map[c.id] = c.name;
  for (const s of strategies) map[s.id] = s.title;
  for (const d of deliverables) map[d.id] = d.title;
  return map;
}
