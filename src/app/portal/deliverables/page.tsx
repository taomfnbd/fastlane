import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getDeliverableTypeLabel, EMPTY_STATES } from "@/lib/portal-constants";
import { relativeTime } from "@/lib/utils";
import {
  Package,
  Mail,
  Globe,
  Share2,
  FileText,
  Megaphone,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata = { title: "Livrables" };

const typeIcons: Record<string, typeof Mail> = {
  EMAIL_TEMPLATE: Mail,
  LANDING_PAGE: Globe,
  SOCIAL_POST: Share2,
  SCRIPT: FileText,
  DOCUMENT: FileText,
  AD_CREATIVE: Megaphone,
  OTHER: Package,
};

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

  const pending = deliverables.filter(
    (d) => d.status === "IN_REVIEW" || d.status === "REVISED" || d.status === "CHANGES_REQUESTED"
  );
  const done = deliverables.filter(
    (d) => d.status === "APPROVED" || d.status === "DELIVERED"
  );

  if (deliverables.length === 0) {
    return (
      <div className="space-y-8 animate-fade-up">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Livrables</h1>
          <p className="text-sm text-muted-foreground">Consultez et validez les livrables soumis par l&apos;equipe</p>
        </div>
        <EmptyState
          icon={Package}
          title={EMPTY_STATES.deliverables.title}
          description={EMPTY_STATES.deliverables.description}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Livrables</h1>
        <p className="text-sm text-muted-foreground">Consultez et validez les livrables soumis par l&apos;equipe</p>
      </div>

      {/* A valider */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            A valider ({pending.length})
          </h2>
          <div className="space-y-2">
            {pending.map((d) => {
              const Icon = typeIcons[d.type] ?? Package;
              const needsAction = d.status === "IN_REVIEW" || d.status === "REVISED";
              return (
                <Link
                  key={d.id}
                  href={`/portal/deliverables/${d.id}`}
                  className={cn(
                    "group flex items-center gap-4 rounded-xl bg-card px-4 py-3.5 transition-all hover:bg-accent hover:shadow-sm",
                    needsAction && "ring-1 ring-amber-500/20 hover:ring-amber-500/40",
                  )}
                >
                  <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate group-hover:underline decoration-muted-foreground/30 underline-offset-2">{d.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getDeliverableTypeLabel(d.type)} · v{d.version} · {relativeTime(d.updatedAt)}
                    </p>
                  </div>
                  <StatusBadge status={d.status} className="shrink-0" />
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Valides */}
      {done.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Termines ({done.length})
          </h2>
          <div className="space-y-2">
            {done.map((d) => {
              const Icon = typeIcons[d.type] ?? Package;
              return (
                <Link
                  key={d.id}
                  href={`/portal/deliverables/${d.id}`}
                  className="group flex items-center gap-4 rounded-xl bg-card/40 px-4 py-3.5 transition-all hover:bg-accent opacity-60 hover:opacity-80"
                >
                  <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate group-hover:underline decoration-muted-foreground/30 underline-offset-2">{d.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getDeliverableTypeLabel(d.type)} · v{d.version} · {relativeTime(d.updatedAt)}
                    </p>
                  </div>
                  <StatusBadge status={d.status} className="shrink-0" />
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
