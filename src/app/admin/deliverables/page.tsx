import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { DeliverablesFilter } from "@/components/admin/deliverables-filter";
import { Package, Mail, Globe, MessageSquare, FileText, Megaphone, MoreHorizontal } from "lucide-react";
import { relativeTime } from "@/lib/utils";
import { getDeliverableTypeLabel } from "@/lib/portal-constants";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export const metadata = { title: "Livrables" };

const typeIcons: Record<string, LucideIcon> = {
  EMAIL_TEMPLATE: Mail,
  LANDING_PAGE: Globe,
  SOCIAL_POST: MessageSquare,
  SCRIPT: FileText,
  DOCUMENT: FileText,
  AD_CREATIVE: Megaphone,
  OTHER: MoreHorizontal,
};

export default async function AdminDeliverablesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; event?: string; company?: string }>;
}) {
  await requireAdmin();
  const { status = "review", event, company } = await searchParams;

  const statusFilter =
    status === "review"
      ? { status: "IN_REVIEW" as const }
      : status === "changes"
        ? { status: "CHANGES_REQUESTED" as const }
        : {};

  const relationFilter: Record<string, unknown> = {};
  if (event) relationFilter.eventId = event;
  if (company) relationFilter.companyId = company;

  const ecWhere = Object.keys(relationFilter).length > 0 ? { eventCompany: relationFilter } : {};

  const [deliverables, counts, events, companies] = await Promise.all([
    prisma.deliverable.findMany({
      where: { ...statusFilter, ...ecWhere },
      orderBy: { updatedAt: "desc" },
      include: {
        eventCompany: {
          include: {
            company: { select: { id: true, name: true } },
            event: { select: { id: true, name: true } },
          },
        },
      },
    }),
    Promise.all([
      prisma.deliverable.count({ where: { status: "IN_REVIEW", ...ecWhere } }),
      prisma.deliverable.count({ where: { status: "CHANGES_REQUESTED", ...ecWhere } }),
      prisma.deliverable.count({ where: ecWhere }),
    ]),
    prisma.event.findMany({ select: { id: true, name: true }, orderBy: { startDate: "desc" } }),
    prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const [reviewCount, changesCount, allCount] = counts;

  return (
    <div className="space-y-4">
      <PageHeader title="Livrables" />
      <DeliverablesFilter
        events={events}
        companies={companies}
        counts={{ review: reviewCount, changes: changesCount, all: allCount }}
      />
      {deliverables.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Aucun livrable"
          description={status === "all" ? "Aucun livrable cree." : "Aucun livrable avec ce statut."}
        />
      ) : (
        <div className="space-y-3">
          {deliverables.map((d) => {
            const TypeIcon = typeIcons[d.type] ?? Package;
            return (
              <Link
                key={d.id}
                href={`/admin/events/${d.eventCompany.event.id}/deliverables?company=${d.eventCompany.company.id}`}
                className="flex items-center gap-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <TypeIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{d.title}</p>
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {d.eventCompany.company.name} · {d.eventCompany.event.name} · {getDeliverableTypeLabel(d.type)} · v{d.version}
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground/60 shrink-0">
                  {relativeTime(d.updatedAt)}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
