import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { CommentSection } from "@/components/shared/comment-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { DeliverableReviewActions } from "@/components/portal/deliverable-review-actions";

export async function generateMetadata({ params }: { params: Promise<{ deliverableId: string }> }) {
  const { deliverableId } = await params;
  const d = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    select: { title: true },
  });
  return { title: d?.title ?? "Deliverable" };
}

export default async function DeliverableDetailPage({
  params,
}: {
  params: Promise<{ deliverableId: string }>;
}) {
  const session = await requireClient();
  const { deliverableId } = await params;

  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    include: {
      eventCompany: {
        include: {
          event: { select: { name: true } },
          company: { select: { id: true } },
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
        where: { parentId: null },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!deliverable) notFound();

  if (deliverable.eventCompany.company.id !== session.companyId) {
    notFound();
  }

  const content = deliverable.content as Record<string, unknown> | null;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/portal/deliverables">
            <ArrowLeft className="mr-1 h-3 w-3" />
            Back to Deliverables
          </Link>
        </Button>
        <PageHeader
          title={deliverable.title}
          description={deliverable.description ?? undefined}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <StatusBadge status={deliverable.status} />
        <Badge variant="outline">{deliverable.type.replace(/_/g, " ")}</Badge>
        <span className="text-muted-foreground">
          {deliverable.eventCompany.event.name} &middot; Version{" "}
          {deliverable.version}
        </span>
      </div>

      {/* Content preview */}
      {content && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {deliverable.type === "EMAIL_TEMPLATE" && content.subject ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Subject</p>
                  <p className="text-sm font-medium">{String(content.subject)}</p>
                </div>
                {content.body ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Body</p>
                    <div className="mt-1 rounded-lg border bg-muted/30 p-4">
                      <pre className="text-sm whitespace-pre-wrap font-sans">
                        {String(content.body)}
                      </pre>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(content, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      )}

      {/* File download */}
      {deliverable.fileUrl && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{deliverable.fileName ?? "Attached file"}</p>
                <p className="text-xs text-muted-foreground">Click to download</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={deliverable.fileUrl} download>
                  <Download className="mr-1 h-3 w-3" />
                  Download
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review actions */}
      {deliverable.status === "IN_REVIEW" && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-3">
              Review this deliverable and approve or request changes.
            </p>
            <DeliverableReviewActions deliverableId={deliverable.id} />
          </CardContent>
        </Card>
      )}

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Discussion</CardTitle>
        </CardHeader>
        <CardContent>
          <CommentSection
            comments={deliverable.comments}
            deliverableId={deliverable.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
