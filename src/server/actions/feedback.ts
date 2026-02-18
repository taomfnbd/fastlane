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
