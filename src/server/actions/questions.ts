"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, getSession, getUserWithRole, isAdmin } from "@/lib/auth-server";
import { createQuestionSchema, answerQuestionSchema } from "@/types";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import { notifyClientUsers, notifyAdmins, notifyCompanyUsers } from "@/lib/notify";

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
  const questionLink = parsed.data.strategyId
    ? `/portal/strategy/${parsed.data.strategyId}`
    : parsed.data.deliverableId
      ? `/portal/deliverables/${parsed.data.deliverableId}`
      : "/portal/contact";

  if (eventCompanyId) {
    await notifyClientUsers(
      eventCompanyId,
      "Nouvelle question",
      "L'equipe vous a pose une question.",
      questionLink,
    );
  } else {
    // Standalone question — notify via companyId directly
    await notifyCompanyUsers(
      parsed.data.targetCompanyId,
      "Nouvelle question",
      "L'equipe vous a pose une question.",
      questionLink,
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

  if (!isAdmin(user.role)) {
    if (user.role !== "CLIENT_ADMIN" || user.companyId !== question.targetCompanyId) {
      return { success: false, error: "Access denied" };
    }
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
  } else {
    // Standalone question — notify all admins directly
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      select: { id: true },
    });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          title: "Reponse recue",
          message: "Le client a repondu a votre question.",
          link: "/admin/dashboard",
          userId: a.id,
        })),
      });
    }
  }

  revalidatePath("/admin");
  revalidatePath("/portal");
  return { success: true, data: undefined };
}

export async function postClientQuestion(content: string): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 5000) {
    return { success: false, error: "Le message doit contenir entre 1 et 5000 caracteres." };
  }

  const user = await getUserWithRole(session.user.id);
  if (!user || !user.companyId) {
    return { success: false, error: "Utilisateur non associe a une entreprise." };
  }

  const question = await prisma.question.create({
    data: {
      content: trimmed,
      authorId: user.id,
      targetCompanyId: user.companyId,
    },
  });

  // Notify all admins about the new support message
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    select: { id: true },
  });
  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        title: "Nouveau message client",
        message: `${user.name} a envoye un message via le support.`,
        link: "/admin/dashboard",
        userId: a.id,
      })),
    });
  }

  revalidatePath("/portal/contact");
  revalidatePath("/admin");
  return { success: true, data: { id: question.id } };
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
