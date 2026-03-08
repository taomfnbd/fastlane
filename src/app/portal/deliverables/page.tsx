import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { EmptyState } from "@/components/shared/empty-state";
import { getDeliverableTypeLabel, EMPTY_STATES } from "@/lib/portal-constants";
import { Package, FileText, Mail, Globe, Share2, Megaphone } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata = { title: "Livrables" };

const typeIconConfig: Record<string, { icon: typeof FileText; color: string }> = {
  EMAIL_TEMPLATE: { icon: Mail, color: "text-blue-500" },
  LANDING_PAGE: { icon: Globe, color: "text-blue-500" },
  SOCIAL_POST: { icon: Share2, color: "text-amber-500" },
  SCRIPT: { icon: FileText, color: "text-rose-500" },
  DOCUMENT: { icon: FileText, color: "text-blue-500" },
  AD_CREATIVE: { icon: Megaphone, color: "text-amber-500" },
  OTHER: { icon: Package, color: "text-muted-foreground" },
};

function getStatusBadge(status: string) {
  switch (status) {
    case "APPROVED":
    case "DELIVERED":
      return { label: "VALID\u00c9", className: "bg-emerald-500/15 text-emerald-500" };
    case "IN_REVIEW":
    case "REVISED":
      return { label: "EN ATTENTE", className: "bg-amber-500/15 text-amber-500" };
    case "CHANGES_REQUESTED":
      return { label: "MODIFICATIONS", className: "bg-red-500/15 text-red-500" };
    default:
      return { label: "SOUMIS", className: "bg-blue-500/15 text-blue-500" };
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default async function PortalDeliverablesPage() {
  const session = await requireClient();

  const deliverables = await prisma.deliverable.findMany({
    where: {
      eventCompany: { companyId: session.companyId },
      status: { not: "DRAFT" },
    },
    include: {
      eventCompany: {
        include: { event: { select: { name: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (deliverables.length === 0) {
    return (
      <div className="space-y-8 animate-fade-up">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Vos D&eacute;livrables</h1>
          <p className="text-sm text-muted-foreground">
            G&eacute;rez et suivez la validation de vos documents d&apos;entreprise
          </p>
        </div>
        <EmptyState
          icon={Package}
          title={EMPTY_STATES.deliverables.title}
          description={EMPTY_STATES.deliverables.description}
        />
      </div>
    );
  }

  const approved = deliverables.filter(
    (d) => d.status === "APPROVED" || d.status === "DELIVERED"
  );
  const total = deliverables.length;
  const progressPercent = total > 0 ? Math.round((approved.length / total) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Page header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Vos D&eacute;livrables</h1>
        <p className="text-sm text-muted-foreground">
          G&eacute;rez et suivez la validation de vos documents d&apos;entreprise
        </p>
      </div>

      {/* Progress header card */}
      <div className="rounded-xl border bg-card p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          &Eacute;tat d&apos;avancement
        </p>
        <div className="mt-3 flex items-baseline justify-between">
          <p className="text-sm text-muted-foreground">
            {approved.length} livrable{approved.length > 1 ? "s" : ""} valid&eacute;{approved.length > 1 ? "s" : ""} sur {total}
          </p>
          <p className="text-2xl font-bold text-primary">{progressPercent}%</p>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-amber-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Document grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium">Mes documents</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {deliverables.map((d) => {
            const config = typeIconConfig[d.type] ?? typeIconConfig.OTHER;
            const Icon = config.icon;
            const badge = getStatusBadge(d.status);

            return (
              <Link
                key={d.id}
                href={`/portal/deliverables/${d.id}`}
                className="group rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Icon area */}
                <div className="flex h-32 items-center justify-center rounded-lg bg-muted/50 m-3 mb-0">
                  <Icon className={cn("h-10 w-10", config.color)} />
                </div>

                {/* Content */}
                <div className="p-3 pt-2.5 space-y-1.5">
                  <p className="text-sm font-medium truncate">{d.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {getDeliverableTypeLabel(d.type)} &middot; {formatDate(d.updatedAt)}
                  </p>
                  <span
                    className={cn(
                      "inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      badge.className,
                    )}
                  >
                    {badge.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
