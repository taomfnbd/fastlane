"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, requireClient, getSession, getUserWithRole, isAdmin } from "@/lib/auth-server";
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
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const strategy = await prisma.strategy.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      content: {},
      eventCompanyId: parsed.data.eventCompanyId,
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

  const strategy = await prisma.strategy.update({
    where: { id: strategyId },
    data: { status: "PENDING_REVIEW" },
    select: { id: true, title: true, eventCompanyId: true },
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

  // Verify access
  const user = await getUserWithRole(session.user.id);
  if (!user) return { success: false, error: "User not found" };

  if (!isAdmin(user.role) && user.companyId !== item.strategy.eventCompany.companyId) {
    return { success: false, error: "Access denied" };
  }

  // Use transaction to prevent race condition when checking all items status
  await prisma.$transaction(async (tx) => {
    await tx.strategyItem.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status },
    });

    // Check if all items are approved
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
  });

  // Notify admins when client approves/rejects an item (outside transaction)
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

  await prisma.strategyItem.delete({ where: { id: itemId } });

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
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const strategy = await prisma.strategy.findUnique({
    where: { id: parsed.data.id },
    select: { id: true },
  });
  if (!strategy) return { success: false, error: "Strategy not found" };

  await prisma.strategy.update({
    where: { id: parsed.data.id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
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
