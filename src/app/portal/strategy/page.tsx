import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Target } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Strategy" };

export default async function PortalStrategyPage() {
  const session = await requireClient();

  const strategies = await prisma.strategy.findMany({
    where: {
      eventCompany: { companyId: session.companyId },
      status: { not: "DRAFT" },
    },
    include: {
      eventCompany: {
        include: { event: { select: { name: true } } },
      },
      items: { select: { id: true, status: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Strategy"
        description="Review and approve growth strategies proposed by the Fastlane team"
      />

      {strategies.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No strategies yet"
          description="Your growth strategies will appear here once the Fastlane team shares them with you."
        />
      ) : (
        <div className="grid gap-4">
          {strategies.map((strategy) => {
            const approvedItems = strategy.items.filter((i) => i.status === "APPROVED").length;
            const totalItems = strategy.items.length;

            return (
              <Link key={strategy.id} href={`/portal/strategy/${strategy.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{strategy.title}</h3>
                        {strategy.description && (
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                            {strategy.description}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-muted-foreground">
                          {strategy.eventCompany.event.name} &middot; v{strategy.version}
                        </p>
                      </div>
                      <StatusBadge status={strategy.status} />
                    </div>
                    {totalItems > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Items reviewed</span>
                          <span>{approvedItems}/{totalItems}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div
                            className="h-1.5 rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${totalItems > 0 ? (approvedItems / totalItems) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
