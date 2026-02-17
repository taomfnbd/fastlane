import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { CommentSection } from "@/components/shared/comment-section";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { StrategyItemReview } from "@/components/portal/strategy-item-review";

export async function generateMetadata({ params }: { params: Promise<{ strategyId: string }> }) {
  const { strategyId } = await params;
  const strategy = await prisma.strategy.findUnique({
    where: { id: strategyId },
    select: { title: true },
  });
  return { title: strategy?.title ?? "Strategy" };
}

export default async function StrategyDetailPage({
  params,
}: {
  params: Promise<{ strategyId: string }>;
}) {
  const session = await requireClient();
  const { strategyId } = await params;

  const strategy = await prisma.strategy.findUnique({
    where: { id: strategyId },
    include: {
      eventCompany: {
        include: {
          event: { select: { name: true } },
          company: { select: { id: true } },
        },
      },
      items: {
        orderBy: { order: "asc" },
        include: {
          comments: {
            include: {
              author: { select: { name: true, image: true } },
              replies: {
                include: { author: { select: { name: true, image: true } } },
                orderBy: { createdAt: "asc" },
              },
            },
            where: { parentId: null },
            orderBy: { createdAt: "asc" },
          },
        },
      },
      comments: {
        include: {
          author: { select: { name: true, image: true } },
          replies: {
            include: { author: { select: { name: true, image: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        where: { parentId: null, strategyItemId: null },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!strategy) notFound();
  if (strategy.eventCompany.company.id !== session.companyId) notFound();

  const approvedItems = strategy.items.filter((i) => i.status === "APPROVED").length;
  const totalItems = strategy.items.length;
  const pct = totalItems > 0 ? Math.round((approvedItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 h-7 text-xs text-muted-foreground">
          <Link href="/portal/strategy">
            <ArrowLeft className="mr-1 h-3 w-3" />
            Strategy
          </Link>
        </Button>
        <PageHeader
          title={strategy.title}
          description={strategy.description ?? undefined}
        />
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <StatusBadge status={strategy.status} />
        <span>{strategy.eventCompany.event.name}</span>
        <span>v{strategy.version}</span>
        {totalItems > 0 && <span>{approvedItems}/{totalItems} approved</span>}
      </div>

      {/* Progress */}
      {totalItems > 0 && (
        <div className="h-1 w-full rounded-full bg-muted">
          <div
            className="h-1 rounded-full bg-emerald-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Strategy Items */}
      <div>
        <h2 className="text-sm font-medium mb-3">Items</h2>
        {strategy.items.length === 0 ? (
          <p className="text-xs text-muted-foreground py-8 text-center">No items yet.</p>
        ) : (
          <div className="space-y-3">
            {strategy.items.map((item, index) => (
              <div key={item.id} className="rounded-md border">
                <div className="flex items-start justify-between px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      <span className="text-muted-foreground tabular-nums">{index + 1}.</span>{" "}
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap pl-5">{item.description}</p>
                    )}
                  </div>
                  <StatusBadge status={item.status} className="shrink-0 ml-3" />
                </div>

                {/* Review actions */}
                {strategy.status === "PENDING_REVIEW" && item.status === "PENDING" && (
                  <div className="px-3 py-2 border-t">
                    <StrategyItemReview itemId={item.id} />
                  </div>
                )}

                {/* Item comments */}
                {item.comments.length > 0 && (
                  <div className="px-3 py-2 border-t">
                    <CommentSection
                      comments={item.comments}
                      strategyItemId={item.id}
                      strategyId={strategy.id}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Discussion */}
      <div>
        <h2 className="text-sm font-medium mb-3">Discussion</h2>
        <div className="rounded-md border p-3">
          <CommentSection
            comments={strategy.comments}
            strategyId={strategy.id}
          />
        </div>
      </div>
    </div>
  );
}
