"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, getSession, getUserWithRole, isAdmin } from "@/lib/auth-server";
import { createStrategySchema, createStrategyItemSchema, updateStrategyItemStatusSchema, updateStrategySchema, updateStrategyItemSchema } from "@/types";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import { notifyAdmins, notifyClientUsers } from "@/lib/notify";

export async function createStrategy(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const session = await requireAdmin();

  const parsed = createStrategySchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    eventCompanyId: formData.get("eventCompanyId"),
    dueDate: formData.get("dueDate") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  let dueDate: Date | null = null;
  if (parsed.data.dueDate) {
    dueDate = new Date(parsed.data.dueDate);
    if (isNaN(dueDate.getTime())) {
      return { success: false, error: "Date d'echeance invalide" };
    }
    if (dueDate <= new Date()) {
      return { success: false, error: "La date d'echeance doit etre dans le futur" };
    }
  }

  const strategy = await prisma.strategy.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      content: {},
      eventCompanyId: parsed.data.eventCompanyId,
      dueDate,
    },
  });

  await prisma.activity.create({
    data: {
      type: "STRATEGY_CREATED",
      message: `created strategy "${parsed.data.title}"`,
      userId: session.user.id,
      strategyId: strategy.id,
    },
  });

  revalidatePath("/admin/events");
  return { success: true, data: { id: strategy.id } };
}

export async function addStrategyItem(formData: FormData): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const parsed = createStrategyItemSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    strategyId: formData.get("strategyId"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const maxOrder = await prisma.strategyItem.findFirst({
    where: { strategyId: parsed.data.strategyId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const item = await prisma.strategyItem.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      strategyId: parsed.data.strategyId,
      order: (maxOrder?.order ?? -1) + 1,
    },
  });

  revalidatePath("/admin/events");
  revalidatePath("/portal/strategy");
  return { success: true, data: { id: item.id } };
}

export async function submitStrategyForReview(strategyId: string): Promise<ActionResult> {
  const session = await requireAdmin();

  const strategy = await prisma.strategy.findUnique({
    where: { id: strategyId },
    select: { id: true, title: true, status: true, eventCompanyId: true },
  });

  if (!strategy) return { success: false, error: "Strategy not found" };
  if (strategy.status !== "DRAFT") {
    return { success: false, error: "La strategie doit etre en brouillon pour etre soumise" };
  }

  await prisma.strategy.update({
    where: { id: strategyId },
    data: { status: "PENDING_REVIEW" },
  });

  // Create activity
  await prisma.activity.create({
    data: {
      type: "STRATEGY_SUBMITTED",
      message: `submitted strategy "${strategy.title}" for review`,
      userId: session.user.id,
      strategyId: strategy.id,
    },
  });

  // Notify client users
  await notifyClientUsers(
    strategy.eventCompanyId,
    "Strategie soumise",
    `"${strategy.title}" est prete pour votre validation.`,
    `/portal/strategy/${strategy.id}`,
  );

  revalidatePath("/admin/events");
  revalidatePath("/portal/strategy");
  revalidatePath("/portal/dashboard");
  return { success: true, data: undefined };
}

export async function updateStrategyItemStatus(
  data: { id: string; status: "APPROVED" | "REJECTED" | "MODIFIED" }
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  const parsed = updateStrategyItemStatusSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const item = await prisma.strategyItem.findUnique({
    where: { id: parsed.data.id },
    include: {
      strategy: {
        include: {
          eventCompany: { select: { companyId: true, id: true } },
        },
      },
    },
  });

  if (!item) return { success: false, error: "Item not found" };

  // Only allow status changes when the strategy is under review
  if (item.strategy.status !== "PENDING_REVIEW" && item.strategy.status !== "REVISED") {
    return { success: false, error: "La strategie doit etre en revision pour modifier le statut des elements" };
  }

  // Verify access
  const user = await getUserWithRole(session.user.id);
  if (!user) return { success: false, error: "User not found" };

  if (!isAdmin(user.role) && user.companyId !== item.strategy.eventCompany.companyId) {
    return { success: false, error: "Access denied" };
  }

  // Transaction returns the final status so notifications are based on committed state
  await prisma.$transaction(async (tx) => {
    await tx.strategyItem.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status },
    });

    const allItems = await tx.strategyItem.findMany({
      where: { strategyId: item.strategyId },
      select: { status: true },
    });

    const allApproved = allItems.every((i) => i.status === "APPROVED");
    const hasRejected = allItems.some((i) => i.status === "REJECTED");

    if (allApproved) {
      await tx.strategy.update({
        where: { id: item.strategyId },
        data: { status: "APPROVED" },
      });
      await tx.activity.create({
        data: {
          type: "STRATEGY_APPROVED",
          message: `approved strategy "${item.strategy.title}"`,
          userId: session.user.id,
          strategyId: item.strategyId,
        },
      });
    } else if (hasRejected) {
      await tx.strategy.update({
        where: { id: item.strategyId },
        data: { status: "CHANGES_REQUESTED" },
      });
      await tx.activity.create({
        data: {
          type: "STRATEGY_REJECTED",
          message: `requested changes on strategy "${item.strategy.title}"`,
          userId: session.user.id,
          strategyId: item.strategyId,
        },
      });
    }

    return { allApproved, hasRejected };
  });

  // Notifications sent AFTER transaction committed, but based on committed state
  if (!isAdmin(user.role)) {
    if (parsed.data.status === "APPROVED") {
      await notifyAdmins(
        item.strategy.eventCompany.id,
        "Element approuve",
        `"${item.title}" (strategie "${item.strategy.title}") a ete approuve par le client.`,
        `/admin/events`,
      );
    } else if (parsed.data.status === "REJECTED") {
      await notifyAdmins(
        item.strategy.eventCompany.id,
        "Modifications demandees",
        `"${item.title}" (strategie "${item.strategy.title}") a ete refuse par le client.`,
        `/admin/events`,
      );
    }
  }

  revalidatePath("/admin/events");
  revalidatePath("/portal/strategy");
  revalidatePath(`/portal/strategy/${item.strategyId}`);
  return { success: true, data: undefined };
}

export async function deleteStrategyItem(itemId: string): Promise<ActionResult> {
  await requireAdmin();

  try {
    await prisma.strategyItem.delete({ where: { id: itemId } });
  } catch {
    return { success: false, error: "Element introuvable" };
  }

  revalidatePath("/admin/events");
  revalidatePath("/portal/strategy");
  revalidatePath("/portal/dashboard");
  return { success: true, data: undefined };
}

export async function updateStrategy(formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = updateStrategySchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    dueDate: formData.get("dueDate") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const strategy = await prisma.strategy.findUnique({
    where: { id: parsed.data.id },
    select: { id: true },
  });
  if (!strategy) return { success: false, error: "Strategy not found" };

  let dueDate: Date | null | undefined = undefined;
  if (parsed.data.dueDate === "") {
    dueDate = null;
  } else if (parsed.data.dueDate) {
    dueDate = new Date(parsed.data.dueDate);
    if (isNaN(dueDate.getTime())) {
      return { success: false, error: "Date d'echeance invalide" };
    }
    if (dueDate <= new Date()) {
      return { success: false, error: "La date d'echeance doit etre dans le futur" };
    }
  }

  await prisma.strategy.update({
    where: { id: parsed.data.id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      ...(dueDate !== undefined ? { dueDate } : {}),
    },
  });

  await prisma.activity.create({
    data: {
      type: "STRATEGY_UPDATED",
      message: `updated strategy "${parsed.data.title}"`,
      userId: session.user.id,
      strategyId: parsed.data.id,
    },
  });

  revalidatePath("/admin/events");
  revalidatePath("/admin/strategies");
  revalidatePath("/portal/strategy");
  return { success: true, data: undefined };
}

export async function updateStrategyItem(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = updateStrategyItemSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const item = await prisma.strategyItem.findUnique({
    where: { id: parsed.data.id },
    select: { id: true },
  });
  if (!item) return { success: false, error: "Item not found" };

  await prisma.strategyItem.update({
    where: { id: parsed.data.id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
    },
  });

  revalidatePath("/admin/events");
  revalidatePath("/admin/strategies");
  revalidatePath("/portal/strategy");
  return { success: true, data: undefined };
}

export async function resubmitStrategy(strategyId: string): Promise<ActionResult> {
  const session = await requireAdmin();

  const strategy = await prisma.strategy.findUnique({
    where: { id: strategyId },
    select: { id: true, title: true, status: true, version: true, eventCompanyId: true },
  });

  if (!strategy) return { success: false, error: "Strategy not found" };
  if (strategy.status !== "CHANGES_REQUESTED") {
    return { success: false, error: "Strategy must be in CHANGES_REQUESTED status to resubmit" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.strategyItem.updateMany({
      where: { strategyId },
      data: { status: "PENDING" },
    });

    await tx.strategy.update({
      where: { id: strategyId },
      data: {
        status: "PENDING_REVIEW",
        version: { increment: 1 },
      },
    });
  });

  await prisma.activity.create({
    data: {
      type: "STRATEGY_SUBMITTED",
      message: `resubmitted strategy "${strategy.title}" (v${strategy.version + 1})`,
      userId: session.user.id,
      strategyId,
    },
  });

  await notifyClientUsers(
    strategy.eventCompanyId,
    "Strategie revisee",
    `"${strategy.title}" a ete revisee et soumise a nouveau (v${strategy.version + 1}).`,
    `/portal/strategy/${strategyId}`,
  );

  revalidatePath("/admin/events");
  revalidatePath("/admin/strategies");
  revalidatePath("/portal/strategy");
  revalidatePath("/portal/dashboard");
  return { success: true, data: undefined };
}

export async function deleteStrategy(strategyId: string): Promise<ActionResult> {
  await requireAdmin();

  const strategy = await prisma.strategy.findUnique({
    where: { id: strategyId },
    select: { id: true, status: true },
  });

  if (!strategy) return { success: false, error: "Strategie introuvable" };
  if (strategy.status !== "DRAFT") {
    return { success: false, error: "Seules les strategies en brouillon peuvent etre supprimees" };
  }

  await prisma.strategy.delete({ where: { id: strategyId } });

  revalidatePath("/admin/events");
  revalidatePath("/admin/strategies");
  revalidatePath("/portal/strategy");
  revalidatePath("/admin/dashboard");
  return { success: true, data: undefined };
}

export async function approveAllStrategyItems(strategyId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  const strategy = await prisma.strategy.findUnique({
    where: { id: strategyId },
    include: {
      eventCompany: { select: { companyId: true, id: true } },
      items: { select: { id: true, status: true } },
    },
  });

  if (!strategy) return { success: false, error: "Strategie introuvable" };

  if (strategy.status !== "PENDING_REVIEW" && strategy.status !== "REVISED") {
    return { success: false, error: "La strategie doit etre en revision pour etre validee" };
  }

  const user = await getUserWithRole(session.user.id);
  if (!user) return { success: false, error: "Utilisateur introuvable" };

  if (!isAdmin(user.role) && user.companyId !== strategy.eventCompany.companyId) {
    return { success: false, error: "Acces refuse" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.strategyItem.updateMany({
      where: { strategyId, status: { not: "APPROVED" } },
      data: { status: "APPROVED" },
    });

    await tx.strategy.update({
      where: { id: strategyId },
      data: { status: "APPROVED" },
    });

    await tx.activity.create({
      data: {
        type: "STRATEGY_APPROVED",
        message: `approved strategy "${strategy.title}"`,
        userId: session.user.id,
        strategyId,
      },
    });
  });

  if (!isAdmin(user.role)) {
    await notifyAdmins(
      strategy.eventCompany.id,
      "Strategie approuvee",
      `"${strategy.title}" a ete entierement approuvee par le client.`,
      `/admin/events`,
    );
  }

  revalidatePath("/admin/events");
  revalidatePath("/portal/strategy");
  revalidatePath(`/portal/strategy/${strategyId}`);
  revalidatePath("/portal/dashboard");
  return { success: true, data: undefined };
}

export async function rejectStrategy(
  strategyId: string,
  reason: string,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  if (!reason.trim()) {
    return { success: false, error: "Une raison est requise" };
  }

  const strategy = await prisma.strategy.findUnique({
    where: { id: strategyId },
    include: {
      eventCompany: { select: { companyId: true, id: true } },
      items: { select: { id: true, status: true } },
    },
  });

  if (!strategy) return { success: false, error: "Strategie introuvable" };

  if (strategy.status !== "PENDING_REVIEW" && strategy.status !== "REVISED") {
    return { success: false, error: "La strategie doit etre en revision pour etre refusee" };
  }

  const user = await getUserWithRole(session.user.id);
  if (!user) return { success: false, error: "Utilisateur introuvable" };

  if (!isAdmin(user.role) && user.companyId !== strategy.eventCompany.companyId) {
    return { success: false, error: "Acces refuse" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.strategyItem.updateMany({
      where: { strategyId, status: { not: "APPROVED" } },
      data: { status: "REJECTED" },
    });

    await tx.strategy.update({
      where: { id: strategyId },
      data: { status: "CHANGES_REQUESTED" },
    });

    await tx.comment.create({
      data: {
        content: reason.trim(),
        authorId: session.user.id,
        strategyId,
      },
    });

    await tx.activity.create({
      data: {
        type: "STRATEGY_REJECTED",
        message: `requested changes on strategy "${strategy.title}"`,
        userId: session.user.id,
        strategyId,
      },
    });
  });

  if (!isAdmin(user.role)) {
    await notifyAdmins(
      strategy.eventCompany.id,
      "Modifications demandees",
      `"${strategy.title}" a ete refusee par le client.`,
      `/admin/events`,
    );
  }

  revalidatePath("/admin/events");
  revalidatePath("/portal/strategy");
  revalidatePath(`/portal/strategy/${strategyId}`);
  revalidatePath("/portal/dashboard");
  return { success: true, data: undefined };
}
