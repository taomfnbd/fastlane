import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { EmptyState } from "@/components/shared/empty-state";
import { EMPTY_STATES } from "@/lib/portal-constants";
import { StrategyCardActions } from "@/components/portal/strategy-card-actions";
import { Target, CheckCircle2 } from "lucide-react";
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
          <h1 className="text-xl font-semibold tracking-tight">
            Bonjour, {companyName}
          </h1>
          {eventName && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
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
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="h-4.5 w-4.5 text-primary" />
                <h2 className="text-sm font-semibold">
                  Strategies proposees
                </h2>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {pending.map((strategy) => {
                  const isPending = needsReview(strategy.status);

                  return (
                    <div
                      key={strategy.id}
                      className="rounded-xl border bg-card p-5 flex flex-col gap-3"
                    >
                      {/* Top row: status + date */}
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {isPending ? "En attente" : "Modifications demandees"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Envoye le {formatDate(strategy.updatedAt)}
                        </span>
                      </div>

                      {/* Title (link to detail) */}
                      <Link
                        href={`/portal/strategy/${strategy.id}`}
                        className="text-lg font-semibold hover:underline decoration-muted-foreground/30 underline-offset-2"
                      >
                        {strategy.title}
                      </Link>

                      {/* Description */}
                      {strategy.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {strategy.description}
                        </p>
                      )}

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* Action buttons */}
                      {isPending && (
                        <StrategyCardActions strategyId={strategy.id} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Approved strategies */}
          {approved.length > 0 && (
            <div className="space-y-4 opacity-60">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                <h2 className="text-sm font-semibold">
                  Strategies validees ({approved.length})
                </h2>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {approved.map((strategy) => (
                  <Link
                    key={strategy.id}
                    href={`/portal/strategy/${strategy.id}`}
                    className="group rounded-xl border bg-card p-5 flex flex-col gap-3 transition-opacity hover:opacity-80"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Approuvee
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(strategy.updatedAt)}
                      </span>
                    </div>

                    <p className="text-lg font-semibold group-hover:underline decoration-muted-foreground/30 underline-offset-2">
                      {strategy.title}
                    </p>

                    {strategy.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {strategy.description}
                      </p>
                    )}
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
