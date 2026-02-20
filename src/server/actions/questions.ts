"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, getSession, getUserWithRole, isAdmin } from "@/lib/auth-server";
import { createQuestionSchema, answerQuestionSchema } from "@/types";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import { notifyClientUsers, notifyAdmins } from "@/lib/notify";

export async function createQuestion(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const session = await requireAdmin();

  const parsed = createQuestionSchema.safeParse({
    content: formData.get("content"),
    targetCompanyId: formData.get("targetCompanyId"),
    strategyId: formData.get("strategyId") || undefined,
    deliverableId: formData.get("deliverableId") || undefined,
    strategyItemId: formData.get("strategyItemId") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // Find the eventCompanyId for notification
  let eventCompanyId: string | null = null;
  if (parsed.data.strategyId) {
    const s = await prisma.strategy.findUnique({ where: { id: parsed.data.strategyId }, select: { eventCompanyId: true } });
    eventCompanyId = s?.eventCompanyId ?? null;
  } else if (parsed.data.deliverableId) {
    const d = await prisma.deliverable.findUnique({ where: { id: parsed.data.deliverableId }, select: { eventCompanyId: true } });
    eventCompanyId = d?.eventCompanyId ?? null;
  }

  const question = await prisma.question.create({
    data: {
      content: parsed.data.content,
      authorId: session.user.id,
      targetCompanyId: parsed.data.targetCompanyId,
      strategyId: parsed.data.strategyId ?? null,
      deliverableId: parsed.data.deliverableId ?? null,
      strategyItemId: parsed.data.strategyItemId ?? null,
    },
  });

  // Notify client
  if (eventCompanyId) {
    await notifyClientUsers(
      eventCompanyId,
      "Nouvelle question",
      "L'equipe vous a pose une question.",
      parsed.data.strategyId
        ? `/portal/strategy/${parsed.data.strategyId}`
        : parsed.data.deliverableId
          ? `/portal/deliverables/${parsed.data.deliverableId}`
          : "/portal/dashboard",
    );
  }

  revalidatePath("/admin");
  revalidatePath("/portal");
  return { success: true, data: { id: question.id } };
}

export async function answerQuestion(formData: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  const parsed = answerQuestionSchema.safeParse({
    id: formData.get("id"),
    answer: formData.get("answer"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const question = await prisma.question.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, targetCompanyId: true, strategyId: true, deliverableId: true, answeredAt: true },
  });

  if (!question) return { success: false, error: "Question not found" };
  if (question.answeredAt) return { success: false, error: "Question already answered" };

  // Verify access: only target company users can answer
  const user = await getUserWithRole(session.user.id);
  if (!user) return { success: false, error: "User not found" };

  if (!isAdmin(user.role) && user.companyId !== question.targetCompanyId) {
    return { success: false, error: "Access denied" };
  }

  await prisma.question.update({
    where: { id: parsed.data.id },
    data: {
      answer: parsed.data.answer,
      answeredAt: new Date(),
    },
  });

  // Notify admins that client answered
  let eventCompanyId: string | null = null;
  if (question.strategyId) {
    const s = await prisma.strategy.findUnique({ where: { id: question.strategyId }, select: { eventCompanyId: true } });
    eventCompanyId = s?.eventCompanyId ?? null;
  } else if (question.deliverableId) {
    const d = await prisma.deliverable.findUnique({ where: { id: question.deliverableId }, select: { eventCompanyId: true } });
    eventCompanyId = d?.eventCompanyId ?? null;
  }

  if (eventCompanyId) {
    await notifyAdmins(
      eventCompanyId,
      "Reponse recue",
      "Le client a repondu a votre question.",
      "/admin/dashboard",
    );
  }

  revalidatePath("/admin");
  revalidatePath("/portal");
  return { success: true, data: undefined };
}

export async function getUnansweredQuestions() {
  await requireAdmin();

  return prisma.question.findMany({
    where: { answeredAt: null },
    include: {
      author: { select: { name: true } },
      targetCompany: { select: { name: true } },
      strategy: { select: { id: true, title: true } },
      deliverable: { select: { id: true, title: true } },
      strategyItem: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
