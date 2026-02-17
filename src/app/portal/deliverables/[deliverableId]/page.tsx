import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { StatusBadge } from "@/components/shared/status-badge";
import { CommentSection } from "@/components/shared/comment-section";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import Link from "next/link";
import { DeliverableReviewActions } from "@/components/portal/deliverable-review-actions";
import { getDeliverableTypeLabel } from "@/lib/portal-constants";
import { relativeTime } from "@/lib/utils";

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
  const needsAction = deliverable.status === "IN_REVIEW" || deliverable.status === "REVISED";
  const isDone = deliverable.status === "APPROVED" || deliverable.status === "DELIVERED";

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 h-7 text-xs text-muted-foreground">
          <Link href="/portal/deliverables">
            <ArrowLeft className="mr-1 h-3 w-3" />
            Retour aux livrables
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">{deliverable.title}</h1>
        {deliverable.description && (
          <p className="text-sm text-muted-foreground mt-0.5">{deliverable.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
          <StatusBadge status={deliverable.status} />
          <span>{getDeliverableTypeLabel(deliverable.type)}</span>
          <span>v{deliverable.version}</span>
          <span>Soumis {relativeTime(deliverable.updatedAt)}</span>
        </div>
      </div>

      {/* Contextual banner */}
      {needsAction && (
        <div className="flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-medium">Votre validation est attendue</span> — revisez le contenu et approuvez ou demandez des modifications.
          </p>
        </div>
      )}
      {isDone && (
        <div className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <p className="text-sm text-emerald-800 dark:text-emerald-300">
            <span className="font-medium">
              {deliverable.status === "DELIVERED" ? "Livrable livre" : "Livrable approuve"}
            </span>
            {" — aucune action requise."}
          </p>
        </div>
      )}

      {/* Content preview */}
      {content && (
        <div>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Apercu
          </h2>
          {deliverable.type === "EMAIL_TEMPLATE" && content.subject ? (
            <div className="mx-auto max-w-2xl rounded-md border bg-white dark:bg-muted/30 p-6 space-y-4">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Objet</p>
                <p className="text-sm font-medium mt-0.5">{String(content.subject)}</p>
              </div>
              {content.body != null && (
                <div className="border-t pt-4">
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert text-sm"
                    dangerouslySetInnerHTML={{
                      __html: String(content.body).includes("<")
                        ? String(content.body)
                        : `<pre class="whitespace-pre-wrap font-sans">${String(content.body)}</pre>`,
                    }}
                  />
                </div>
              )}
            </div>
          ) : deliverable.type === "SCRIPT" ? (
            <div className="rounded-md border p-4">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {typeof content === "string" ? content : JSON.stringify(content, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="rounded-md border p-4">
              <pre className="text-xs whitespace-pre-wrap font-mono text-muted-foreground">
                {JSON.stringify(content, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* File download */}
      {deliverable.fileUrl && (
        <div className="flex items-center gap-3 rounded-md border p-4">
          <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
          <div className="min-w-0 flex-1">
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

      {/* Comments */}
      <div>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Commentaires ({deliverable.comments.length})
        </h2>
        <div className="rounded-md border p-3">
          <CommentSection
            comments={deliverable.comments}
            deliverableId={deliverable.id}
          />
        </div>
      </div>

      {/* Sticky action bar */}
      {needsAction && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-4">
          <div className="max-w-3xl mx-auto">
            <DeliverableReviewActions deliverableId={deliverable.id} />
          </div>
        </div>
      )}
    </div>
  );
}
