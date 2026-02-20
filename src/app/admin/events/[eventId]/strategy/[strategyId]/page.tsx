import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { StatusBadge } from "@/components/shared/status-badge";
import { CommentSection } from "@/components/shared/comment-section";
import { QuestionSection } from "@/components/shared/question-section";
import { EditStrategyDialog } from "@/components/admin/edit-strategy-dialog";
import { EditStrategyItemDialog } from "@/components/admin/edit-strategy-item-dialog";
import { ResubmitButton } from "@/components/admin/resubmit-button";
import { SubmitStrategyButton } from "@/components/admin/submit-strategy-button";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ strategyId: string }> }) {
  const { strategyId } = await params;
  const strategy = await prisma.strategy.findUnique({ where: { id: strategyId }, select: { title: true } });
  return { title: strategy?.title ?? "Strategie" };
}

export default async function AdminStrategyDetailPage({
  params,
}: {
  params: Promise<{ eventId: string; strategyId: string }>;
}) {
  const session = await requireAdmin();
  const { eventId, strategyId } = await params;

  const strategy = await prisma.strategy.findUnique({
    where: { id: strategyId },
    include: {
      eventCompany: {
        include: {
          event: { select: { name: true } },
          company: { select: { id: true, name: true } },
        },
      },
      items: {
        orderBy: { order: "asc" },
        include: {
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
      },
      comments: {
        include: {
          author: { select: { id: true, name: true, image: true } },
          replies: {
            include: { author: { select: { id: true, name: true, image: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        where: { parentId: null, strategyItemId: null },
        orderBy: { createdAt: "asc" },
      },
      questions: {
        where: { strategyItemId: null },
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!strategy) notFound();

  const approvedItems = strategy.items.filter((i) => i.status === "APPROVED").length;
  const totalItems = strategy.items.length;
  const companyId = strategy.eventCompany.company.id;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 h-7 text-xs text-muted-foreground">
          <Link href={`/admin/events/${eventId}/strategy`}><ArrowLeft className="mr-1 h-3 w-3" />Strategies</Link>
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">{strategy.title}</h1>
          <EditStrategyDialog strategy={{ id: strategy.id, title: strategy.title, description: strategy.description }} />
        </div>
        {strategy.description && <p className="text-sm text-muted-foreground mt-0.5">{strategy.description}</p>}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
          <StatusBadge status={strategy.status} />
          <span>{strategy.eventCompany.company.name}</span>
          <span>{strategy.eventCompany.event.name}</span>
          <span>v{strategy.version}</span>
          {totalItems > 0 && <span>{approvedItems}/{totalItems} approuves</span>}
        </div>
        <div className="flex gap-2 mt-2">
          {strategy.status === "DRAFT" && <SubmitStrategyButton strategyId={strategy.id} />}
          {strategy.status === "CHANGES_REQUESTED" && <ResubmitButton id={strategy.id} type="strategy" />}
        </div>
      </div>

      {strategy.items.map((item, index) => (
        <div key={item.id} className="rounded-md border">
          <div className="flex items-center justify-between px-3 py-2.5 border-b">
            <div className="min-w-0">
              <p className="text-sm font-medium"><span className="text-muted-foreground tabular-nums">{index + 1}.</span> {item.title}</p>
              {item.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 pl-5">{item.description}</p>}
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-3">
              <StatusBadge status={item.status} />
              <EditStrategyItemDialog item={{ id: item.id, title: item.title, description: item.description }} />
            </div>
          </div>
          <div className="px-3 py-2.5 space-y-3">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Commentaires</p>
            <CommentSection
              comments={item.comments.map((c) => ({ ...c, authorId: c.author.id, replies: c.replies.map((r) => ({ ...r, authorId: r.author.id })) }))}
              currentUserId={session.user.id}
              strategyId={strategy.id}
              strategyItemId={item.id}
            />
          </div>
          <div className="px-3 py-2.5 border-t space-y-3">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Questions</p>
            <QuestionSection
              questions={item.questions}
              isAdmin={true}
              targetCompanyId={companyId}
              strategyId={strategy.id}
              strategyItemId={item.id}
            />
          </div>
        </div>
      ))}

      <div>
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">Commentaires generaux</h2>
        <div className="rounded-xl border p-3">
          <CommentSection
            comments={strategy.comments.map((c) => ({ ...c, authorId: c.author.id, replies: c.replies.map((r) => ({ ...r, authorId: r.author.id })) }))}
            currentUserId={session.user.id}
            strategyId={strategy.id}
          />
        </div>
      </div>

      <div>
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">Questions generales</h2>
        <div className="rounded-xl border p-3">
          <QuestionSection
            questions={strategy.questions}
            isAdmin={true}
            targetCompanyId={companyId}
            strategyId={strategy.id}
          />
        </div>
      </div>
    </div>
  );
}
