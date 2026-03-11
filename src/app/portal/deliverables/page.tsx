import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { EmptyState } from "@/components/shared/empty-state";
import { getDeliverableTypeLabel, EMPTY_STATES } from "@/lib/portal-constants";
import { Package } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata = { title: "Livrables" };

const typeIconMap: Record<string, string> = {
  EMAIL_TEMPLATE: "mail",
  LANDING_PAGE: "language",
  SOCIAL_POST: "share",
  SCRIPT: "code",
  DOCUMENT: "description",
  AD_CREATIVE: "campaign",
  OTHER: "inventory_2",
};

const typeColorMap: Record<string, string> = {
  EMAIL_TEMPLATE: "text-blue-500",
  LANDING_PAGE: "text-blue-500",
  SOCIAL_POST: "text-amber-500",
  SCRIPT: "text-rose-500",
  DOCUMENT: "text-blue-500",
  AD_CREATIVE: "text-amber-500",
  OTHER: "text-muted-foreground",
};

function getStatusPill(status: string) {
  switch (status) {
    case "APPROVED":
    case "DELIVERED":
      return { label: "VALIDÉ", className: "bg-emerald-500/20 text-emerald-400" };
    case "IN_REVIEW":
    case "REVISED":
      return { label: "EN ATTENTE", className: "bg-amber-500/20 text-amber-400" };
    case "CHANGES_REQUESTED":
      return { label: "MODIFICATIONS", className: "bg-red-500/20 text-red-400" };
    default:
      return { label: "SOUMIS", className: "bg-emerald-500/20 text-emerald-400" };
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Vos Délivrables</h1>
          <p className="text-sm text-muted-foreground">
            Gérez et suivez la validation de vos documents d&apos;entreprise
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Vos Délivrables</h1>
        <p className="text-sm text-muted-foreground">
          Gérez et suivez la validation de vos documents d&apos;entreprise
        </p>
      </div>

      {/* Progress card */}
      <div className="rounded-xl bg-card p-6 border border-primary/5 shadow-portal-card">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Progression totale</p>
            <h2 className="text-3xl font-bold text-foreground">{progressPercent}%</h2>
          </div>
          <p className="text-sm font-medium text-[#6961ff]">
            {approved.length} sur {total} fichiers validés
          </p>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full custom-glow transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Document grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Mes documents</h2>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {deliverables.map((d) => {
            const icon = typeIconMap[d.type] ?? "inventory_2";
            const iconColor = typeColorMap[d.type] ?? "text-muted-foreground";
            const pill = getStatusPill(d.status);

            return (
              <Link
                key={d.id}
                href={`/portal/deliverables/${d.id}`}
                className="group relative flex flex-col p-4 rounded-xl bg-card border border-primary/5 hover:border-[#6961ff] transition-all"
              >
                {/* Icon area */}
                <div className="w-full aspect-square rounded-lg mb-4 bg-muted flex items-center justify-center">
                  <span className={cn("material-symbols-outlined text-4xl", iconColor)}>
                    {icon}
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-1">
                  <h4 className="font-semibold text-sm truncate text-foreground">{d.title}</h4>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    {getDeliverableTypeLabel(d.type)} &middot; {d.eventCompany.event.name}
                  </p>
                  <span
                    className={cn(
                      "mt-2 inline-flex items-center self-start px-2 py-0.5 rounded-full text-[10px] font-bold",
                      pill.className,
                    )}
                  >
                    {pill.label}
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
