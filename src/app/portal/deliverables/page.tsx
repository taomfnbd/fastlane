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
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

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
      <div className="space-y-4">
        <h1 className="text-lg font-semibold">Livrables</h1>
        <EmptyState
          icon={Package}
          title={EMPTY_STATES.deliverables.title}
          description={EMPTY_STATES.deliverables.description}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Livrables</h1>

      {/* A valider */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
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
                  className="flex items-center gap-3 rounded-md border px-4 py-3 hover:bg-accent/50 transition-colors group"
                >
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{d.title}</p>
                      {needsAction && (
                        <span className="shrink-0 inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-950 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                          A valider
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {getDeliverableTypeLabel(d.type)} · Soumis {relativeTime(d.updatedAt)} · v{d.version}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors shrink-0 flex items-center gap-1">
                    Voir
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Valides */}
      {done.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Valides ({done.length})
          </h2>
          <div className="rounded-md border divide-y">
            {done.map((d) => {
              const Icon = typeIcons[d.type] ?? Package;
              return (
                <Link
                  key={d.id}
                  href={`/portal/deliverables/${d.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors"
                >
                  <Icon className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                  <p className="text-sm truncate flex-1">{d.title}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={d.status} />
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
