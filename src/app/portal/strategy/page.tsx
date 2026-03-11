import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { EmptyState } from "@/components/shared/empty-state";
import { EMPTY_STATES } from "@/lib/portal-constants";
import { StrategyCardActions } from "@/components/portal/strategy-card-actions";
import { Target } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Strategies" };

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default async function PortalStrategyPage() {
  const session = await requireClient();

  const [company, strategies] = await Promise.all([
    prisma.company.findUnique({
      where: { id: session.companyId },
      select: { name: true },
    }),
    prisma.strategy.findMany({
      where: {
        eventCompany: { companyId: session.companyId },
        status: { not: "DRAFT" },
      },
      include: {
        eventCompany: {
          include: { event: { select: { name: true } } },
        },
        items: { select: { id: true, status: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const needsReview = (status: string) =>
    status === "PENDING_REVIEW" || status === "REVISED";

  const pending = strategies.filter(
    (s) => needsReview(s.status) || s.status === "CHANGES_REQUESTED",
  );
  const approved = strategies.filter((s) => s.status === "APPROVED");

  const companyName = company?.name ?? "votre entreprise";
  const eventName = strategies[0]?.eventCompany.event.name;

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Page header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Bonjour, {companyName}
          </h1>
          {eventName && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-[#6961ff] border border-primary/20">
              {eventName}
            </span>
          )}
        </div>
      </div>

      {strategies.length === 0 ? (
        <EmptyState
          icon={Target}
          title={EMPTY_STATES.strategies.title}
          description={EMPTY_STATES.strategies.description}
        />
      ) : (
        <>
          {/* Pending strategies */}
          {pending.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#6961ff] text-xl">track_changes</span>
                <h2 className="text-sm font-semibold text-foreground">
                  Stratégies proposées
                </h2>
              </div>

              <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {pending.map((strategy) => {
                  const isPending = needsReview(strategy.status);

                  return (
                    <div
                      key={strategy.id}
                      className="bg-card rounded-xl shadow-lg border border-primary/5 overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] h-fit"
                    >
                      <div className="p-6 space-y-5">
                        {/* Top row: status + date */}
                        <div className="flex justify-between items-start">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-[#6961ff] border border-primary/20">
                            <span className="material-symbols-outlined text-[14px] mr-1">schedule</span>
                            {isPending ? "En attente" : "Modifications demandées"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Envoyé le {formatDate(strategy.updatedAt)}
                          </span>
                        </div>

                        {/* Title */}
                        <div>
                          <Link
                            href={`/portal/strategy/${strategy.id}`}
                            className="text-lg font-bold hover:text-[#6961ff] transition-colors"
                          >
                            {strategy.title}
                          </Link>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {strategy.eventCompany.event.name}
                          </p>

                          {strategy.description && (
                            <p className="text-muted-foreground text-sm leading-relaxed mt-2 line-clamp-3">
                              {strategy.description}
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        {isPending && (
                          <StrategyCardActions strategyId={strategy.id} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Approved strategies */}
          {approved.length > 0 && (
            <div className="space-y-6 opacity-60">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500 text-xl">check_circle</span>
                <h2 className="text-sm font-semibold text-foreground">
                  Stratégies validées ({approved.length})
                </h2>
              </div>

              <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {approved.map((strategy) => (
                  <Link
                    key={strategy.id}
                    href={`/portal/strategy/${strategy.id}`}
                    className="group bg-card rounded-xl shadow-lg border border-primary/5 overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] h-fit"
                  >
                    <div className="p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="material-symbols-outlined text-[14px] mr-1">check_circle</span>
                          Approuvée
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(strategy.updatedAt)}
                        </span>
                      </div>

                      <p className="text-lg font-bold group-hover:text-[#6961ff] transition-colors">
                        {strategy.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {strategy.eventCompany.event.name}
                      </p>

                      {strategy.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                          {strategy.description}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
