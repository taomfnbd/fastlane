import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { CommentSection } from "@/components/shared/comment-section";
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
  return { title: d?.title ?? "Livrable" };
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
  if (deliverable.eventCompany.company.id !== session.companyId) notFound();

  const content = deliverable.content as Record<string, unknown> | null;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 h-7 text-xs text-muted-foreground">
          <Link href="/portal/deliverables">
            <ArrowLeft className="mr-1 h-3 w-3" />
            Livrables
          </Link>
        </Button>
        <PageHeader
          title={deliverable.title}
          description={deliverable.description ?? undefined}
        />
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <StatusBadge status={deliverable.status} />
        <span>{deliverable.type.replace(/_/g, " ").toLowerCase()}</span>
        <span>{deliverable.eventCompany.event.name}</span>
        <span>v{deliverable.version}</span>
      </div>

      {/* Content preview */}
      {content && (
        <div>
          <h2 className="text-sm font-medium mb-3">Apercu</h2>
          <div className="rounded-md border p-3">
            {deliverable.type === "EMAIL_TEMPLATE" && content.subject ? (
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Objet</p>
                  <p className="text-sm font-medium mt-0.5">{String(content.subject)}</p>
                </div>
                {content.body ? (
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Contenu</p>
                    <pre className="mt-1 text-sm whitespace-pre-wrap font-sans text-muted-foreground">
                      {String(content.body)}
                    </pre>
                  </div>
                ) : null}
              </div>
            ) : (
              <pre className="text-xs whitespace-pre-wrap font-mono text-muted-foreground">
                {JSON.stringify(content, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* File download */}
      {deliverable.fileUrl && (
        <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
          <div>
            <p className="text-sm font-medium">{deliverable.fileName ?? "Fichier joint"}</p>
            <p className="text-[11px] text-muted-foreground">Cliquer pour telecharger</p>
          </div>
          <Button variant="outline" size="sm" asChild className="h-7 text-xs">
            <a href={deliverable.fileUrl} download>
              <Download className="mr-1 h-3 w-3" />
              Telecharger
            </a>
          </Button>
        </div>
      )}

      {/* Review actions */}
      {deliverable.status === "IN_REVIEW" && (
        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground mb-3">
            Revisez ce livrable et approuvez ou demandez des modifications.
          </p>
          <DeliverableReviewActions deliverableId={deliverable.id} />
        </div>
      )}

      {/* Discussion */}
      <div>
        <h2 className="text-sm font-medium mb-3">Commentaires</h2>
        <div className="rounded-md border p-3">
          <CommentSection
            comments={deliverable.comments}
            deliverableId={deliverable.id}
          />
        </div>
      </div>
    </div>
  );
}
