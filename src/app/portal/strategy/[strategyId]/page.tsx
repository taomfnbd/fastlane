import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { CommentSection } from "@/components/shared/comment-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  // Verify company access
  if (strategy.eventCompany.company.id !== session.companyId) {
    notFound();
  }

  const approvedItems = strategy.items.filter((i) => i.status === "APPROVED").length;
  const totalItems = strategy.items.length;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/portal/strategy">
            <ArrowLeft className="mr-1 h-3 w-3" />
            Back to Strategies
          </Link>
        </Button>
        <PageHeader
          title={strategy.title}
          description={strategy.description ?? undefined}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <StatusBadge status={strategy.status} />
        <span className="text-muted-foreground">
          {strategy.eventCompany.event.name} &middot; Version {strategy.version}
        </span>
        {totalItems > 0 && (
          <span className="text-muted-foreground">
            {approvedItems}/{totalItems} items approved
          </span>
        )}
      </div>

      {/* Progress bar */}
      {totalItems > 0 && (
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-emerald-500 transition-all"
            style={{ width: `${(approvedItems / totalItems) * 100}%` }}
          />
        </div>
      )}

      {/* Strategy Items */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Strategy Items</h2>
        {strategy.items.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No strategy items yet.
            </CardContent>
          </Card>
        ) : (
          strategy.items.map((item, index) => (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">
                    {index + 1}. {item.title}
                  </CardTitle>
                  <StatusBadge status={item.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {item.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {item.description}
                  </p>
                )}

                {/* Review actions for pending items */}
                {strategy.status === "PENDING_REVIEW" && item.status === "PENDING" && (
                  <StrategyItemReview itemId={item.id} />
                )}

                {/* Item comments */}
                {item.comments.length > 0 && (
                  <div className="border-t pt-4">
                    <CommentSection
                      comments={item.comments}
                      strategyItemId={item.id}
                      strategyId={strategy.id}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* General comments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Discussion</CardTitle>
        </CardHeader>
        <CardContent>
          <CommentSection
            comments={strategy.comments}
            strategyId={strategy.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
