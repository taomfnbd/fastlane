import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { StatusBadge } from "@/components/shared/status-badge";
import { CommentSection } from "@/components/shared/comment-section";
import { QuestionSection } from "@/components/shared/question-section";
import { EditDeliverableDialog } from "@/components/admin/edit-deliverable-dialog";
import { ResubmitButton } from "@/components/admin/resubmit-button";
import { MarkDeliveredButton } from "@/components/admin/mark-delivered-button";
import { SubmitDeliverableButton } from "@/components/admin/submit-deliverable-button";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Download } from "lucide-react";
import Link from "next/link";
import { relativeTime } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ deliverableId: string }> }) {
  const { deliverableId } = await params;
  const d = await prisma.deliverable.findUnique({ where: { id: deliverableId }, select: { title: true } });
  return { title: d?.title ?? "Livrable" };
}

export default async function AdminDeliverableDetailPage({
  params,
}: {
  params: Promise<{ eventId: string; deliverableId: string }>;
}) {
  const session = await requireAdmin();
  const { eventId, deliverableId } = await params;

  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    include: {
      eventCompany: {
        include: {
          event: { select: { name: true } },
          company: { select: { id: true, name: true } },
        },
      },
      comments: {
        include: {
          author: { select: { id: true, name: true, image: true } },
          replies: {
            include: { author: { select: { id: true, name: true, image: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        where: { parentId: null },
        orderBy: { createdAt: "asc" },
      },
      questions: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!deliverable) notFound();

  const content = deliverable.content as Record<string, unknown> | null;
  const textContent = content && "text" in content ? String(content.text) : null;
  const companyId = deliverable.eventCompany.company.id;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 h-7 text-xs text-muted-foreground">
          <Link href={`/admin/events/${eventId}/deliverables`}><ArrowLeft className="mr-1 h-3 w-3" />Livrables</Link>
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">{deliverable.title}</h1>
          <EditDeliverableDialog deliverable={{ id: deliverable.id, title: deliverable.title, description: deliverable.description, type: deliverable.type, content: deliverable.content }} />
        </div>
        {deliverable.description && <p className="text-sm text-muted-foreground mt-0.5">{deliverable.description}</p>}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
          <StatusBadge status={deliverable.status} />
          <span>{deliverable.eventCompany.company.name}</span>
          <span>{deliverable.type.replace(/_/g, " ").toLowerCase()}</span>
          <span>v{deliverable.version}</span>
          <span>Mis a jour {relativeTime(deliverable.updatedAt)}</span>
        </div>
        <div className="flex gap-2 mt-2">
          {deliverable.status === "DRAFT" && <SubmitDeliverableButton deliverableId={deliverable.id} />}
          {deliverable.status === "CHANGES_REQUESTED" && <ResubmitButton id={deliverable.id} type="deliverable" />}
          {deliverable.status === "APPROVED" && <MarkDeliveredButton deliverableId={deliverable.id} />}
        </div>
      </div>

      {textContent && (
        <div>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Contenu</h2>
          <div className="rounded-xl border p-4">
            <pre className="whitespace-pre-wrap font-sans text-sm">{textContent}</pre>
          </div>
        </div>
      )}

      {deliverable.fileUrl && (
        <div className="flex items-center gap-3 rounded-xl border p-4">
          <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{deliverable.fileName ?? "Fichier joint"}</p>
          </div>
          <Button variant="outline" size="sm" asChild className="h-7 text-xs">
            <a href={deliverable.fileUrl} download><Download className="mr-1 h-3 w-3" />Telecharger</a>
          </Button>
        </div>
      )}

      <div>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Commentaires ({deliverable.comments.length})</h2>
        <div className="rounded-xl border p-3">
          <CommentSection
            comments={deliverable.comments.map((c) => ({ ...c, authorId: c.author.id, replies: c.replies.map((r) => ({ ...r, authorId: r.author.id })) }))}
            currentUserId={session.user.id}
            deliverableId={deliverable.id}
          />
        </div>
      </div>

      <div>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Questions</h2>
        <div className="rounded-xl border p-3">
          <QuestionSection
            questions={deliverable.questions}
            isAdmin={true}
            targetCompanyId={companyId}
            deliverableId={deliverable.id}
          />
        </div>
      </div>
    </div>
  );
}
