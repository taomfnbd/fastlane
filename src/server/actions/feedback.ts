"use server";

import { prisma } from "@/lib/prisma";
import { getSession, getUserWithRole, isAdmin } from "@/lib/auth-server";
import { createCommentSchema } from "@/types";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import { notifyCommentParties } from "@/lib/notify";

export async function addComment(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  const parsed = createCommentSchema.safeParse({
    content: formData.get("content"),
    strategyId: formData.get("strategyId") || undefined,
    strategyItemId: formData.get("strategyItemId") || undefined,
    deliverableId: formData.get("deliverableId") || undefined,
    parentId: formData.get("parentId") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { content, strategyId, strategyItemId, deliverableId, parentId } = parsed.data;

  // Verify access
  const user = await getUserWithRole(session.user.id);
  if (!user) return { success: false, error: "User not found" };

  if (!isAdmin(user.role)) {
    // Client users can only comment on their own company's items
    if (strategyId) {
      const strategy = await prisma.strategy.findUnique({
        where: { id: strategyId },
        include: { eventCompany: { select: { companyId: true } } },
      });
      if (!strategy || strategy.eventCompany.companyId !== user.companyId) {
        return { success: false, error: "Access denied" };
      }
    }
    if (deliverableId) {
      const deliverable = await prisma.deliverable.findUnique({
        where: { id: deliverableId },
        include: { eventCompany: { select: { companyId: true } } },
      });
      if (!deliverable || deliverable.eventCompany.companyId !== user.companyId) {
        return { success: false, error: "Access denied" };
      }
    }
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      authorId: session.user.id,
      strategyId: strategyId ?? null,
      strategyItemId: strategyItemId ?? null,
      deliverableId: deliverableId ?? null,
      parentId: parentId ?? null,
    },
  });

  // Create activity
  let targetName = "an item";
  if (strategyId) {
    const s = await prisma.strategy.findUnique({ where: { id: strategyId }, select: { title: true } });
    targetName = s?.title ?? "a strategy";
  } else if (deliverableId) {
    const d = await prisma.deliverable.findUnique({ where: { id: deliverableId }, select: { title: true } });
    targetName = d?.title ?? "a deliverable";
  }

  await prisma.activity.create({
    data: {
      type: "COMMENT_ADDED",
      message: `commented on "${targetName}"`,
      userId: session.user.id,
      strategyId: strategyId ?? null,
      deliverableId: deliverableId ?? null,
    },
  });

  // Notify the other party (admin ↔ client)
  if (strategyId) {
    await notifyCommentParties(
      session.user.id,
      "strategy",
      strategyId,
      `Nouveau commentaire sur "${targetName}"`,
      `/portal/strategy/${strategyId}`,
    );
  } else if (deliverableId) {
    await notifyCommentParties(
      session.user.id,
      "deliverable",
      deliverableId,
      `Nouveau commentaire sur "${targetName}"`,
      `/portal/deliverables/${deliverableId}`,
    );
  }

  revalidatePath("/admin/events");
  revalidatePath("/portal/strategy");
  revalidatePath("/portal/deliverables");
  return { success: true, data: { id: comment.id } };
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, strategyId: true, deliverableId: true },
  });

  if (!comment) return { success: false, error: "Comment not found" };
  if (comment.authorId !== session.user.id) {
    const user = await getUserWithRole(session.user.id);
    if (!user || !isAdmin(user.role)) {
      return { success: false, error: "Access denied" };
    }
  }

  await prisma.comment.deleteMany({ where: { parentId: commentId } });
  await prisma.comment.delete({ where: { id: commentId } });

  revalidatePath("/portal/strategy");
  revalidatePath("/portal/deliverables");
  revalidatePath("/admin/events");
  return { success: true, data: undefined };
}

export async function updateComment(commentId: string, content: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  if (!content.trim()) return { success: false, error: "Comment cannot be empty" };

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true },
  });

  if (!comment) return { success: false, error: "Comment not found" };
  if (comment.authorId !== session.user.id) {
    return { success: false, error: "Only the author can edit" };
  }

  await prisma.comment.update({
    where: { id: commentId },
    data: { content: content.trim() },
  });

  revalidatePath("/portal/strategy");
  revalidatePath("/portal/deliverables");
  revalidatePath("/admin/events");
  return { success: true, data: undefined };
}
