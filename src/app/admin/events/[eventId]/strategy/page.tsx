import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { CreateStrategyDialog } from "@/components/admin/create-strategy-dialog";
import { SubmitStrategyButton } from "@/components/admin/submit-strategy-button";
import { AddStrategyItemDialog } from "@/components/admin/add-strategy-item-dialog";

export const metadata = { title: "Strategy Management" };

export default async function EventStrategyPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ company?: string }>;
}) {
  await requireAdmin();
  const { eventId } = await params;
  const { company: companyFilter } = await searchParams;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      companies: {
        include: {
          company: { select: { id: true, name: true } },
          strategies: {
            include: {
              items: { orderBy: { order: "asc" } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
        ...(companyFilter ? { where: { companyId: companyFilter } } : {}),
      },
    },
  });

  if (!event) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={`/admin/events/${eventId}`}>
            <ArrowLeft className="mr-1 h-3 w-3" />
            Back to Event
          </Link>
        </Button>
        <PageHeader
          title="Strategy Management"
          description={`${event.name} — Manage growth strategies`}
        />
      </div>

      {event.companies.map((ec) => (
        <div key={ec.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{ec.company.name}</h2>
            <CreateStrategyDialog eventCompanyId={ec.id} companyName={ec.company.name} />
          </div>

          {ec.strategies.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No strategies yet"
              description={`Create a strategy for ${ec.company.name}.`}
              action={
                <CreateStrategyDialog
                  eventCompanyId={ec.id}
                  companyName={ec.company.name}
                />
              }
            />
          ) : (
            ec.strategies.map((strategy) => (
              <Card key={strategy.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{strategy.title}</CardTitle>
                      {strategy.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {strategy.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={strategy.status} />
                      {strategy.status === "DRAFT" && (
                        <SubmitStrategyButton strategyId={strategy.id} />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Items list */}
                  {strategy.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {index + 1}. {item.title}
                        </p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  ))}

                  {/* Add item */}
                  <AddStrategyItemDialog strategyId={strategy.id} />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ))}
    </div>
  );
}
