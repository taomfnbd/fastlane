"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import { notifyClientUsers } from "@/lib/notify";

export async function bulkApproveDeliverables(ids: string[]): Promise<ActionResult> {
  const session = await requireAdmin();

  if (ids.length === 0) {
    return { success: false, error: "Aucun element selectionne" };
  }

  const deliverables = await prisma.deliverable.findMany({
    where: { id: { in: ids }, status: "IN_REVIEW" },
    select: { id: true, title: true, eventCompanyId: true },
  });

  if (deliverables.length === 0) {
    return { success: false, error: "Aucun livrable en revision trouve parmi la selection" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.deliverable.updateMany({
      where: { id: { in: deliverables.map((d) => d.id) } },
      data: { status: "APPROVED" },
    });

    await tx.activity.createMany({
      data: deliverables.map((d) => ({
        type: "DELIVERABLE_APPROVED" as const,
        message: `approved deliverable "${d.title}" (bulk)`,
        userId: session.user.id,
        deliverableId: d.id,
      })),
    });
  });

  const ecIds = [...new Set(deliverables.map((d) => d.eventCompanyId))];
  for (const ecId of ecIds) {
    const titles = deliverables
      .filter((d) => d.eventCompanyId === ecId)
      .map((d) => d.title);
    await notifyClientUsers(
      ecId,
      "Livrables approuves",
      `${titles.length} livrable${titles.length > 1 ? "s" : ""} approuve${titles.length > 1 ? "s" : ""} : ${titles.join(", ")}`,
    );
  }

  revalidatePath("/admin/events");
  revalidatePath("/admin/deliverables");
  revalidatePath("/portal/deliverables");
  revalidatePath("/portal/dashboard");
  return { success: true, data: undefined };
}

export async function bulkSubmitStrategies(ids: string[]): Promise<ActionResult> {
  const session = await requireAdmin();

  if (ids.length === 0) {
    return { success: false, error: "Aucun element selectionne" };
  }

  const strategies = await prisma.strategy.findMany({
    where: { id: { in: ids }, status: "DRAFT" },
    select: { id: true, title: true, eventCompanyId: true },
  });

  if (strategies.length === 0) {
    return { success: false, error: "Aucune strategie en brouillon trouvee parmi la selection" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.strategy.updateMany({
      where: { id: { in: strategies.map((s) => s.id) } },
      data: { status: "PENDING_REVIEW" },
    });

    await tx.activity.createMany({
      data: strategies.map((s) => ({
        type: "STRATEGY_SUBMITTED" as const,
        message: `submitted strategy "${s.title}" for review (bulk)`,
        userId: session.user.id,
        strategyId: s.id,
      })),
    });
  });

  const ecIds = [...new Set(strategies.map((s) => s.eventCompanyId))];
  for (const ecId of ecIds) {
    const titles = strategies
      .filter((s) => s.eventCompanyId === ecId)
      .map((s) => s.title);
    await notifyClientUsers(
      ecId,
      "Strategies soumises",
      `${titles.length} strategie${titles.length > 1 ? "s" : ""} soumise${titles.length > 1 ? "s" : ""} pour validation : ${titles.join(", ")}`,
    );
  }

  revalidatePath("/admin/events");
  revalidatePath("/admin/strategies");
  revalidatePath("/portal/strategy");
  revalidatePath("/portal/dashboard");
  return { success: true, data: undefined };
}

export async function bulkMarkDelivered(ids: string[]): Promise<ActionResult> {
  const session = await requireAdmin();

  if (ids.length === 0) {
    return { success: false, error: "Aucun element selectionne" };
  }

  const deliverables = await prisma.deliverable.findMany({
    where: { id: { in: ids }, status: "APPROVED" },
    select: { id: true, title: true, eventCompanyId: true },
  });

  if (deliverables.length === 0) {
    return { success: false, error: "Aucun livrable approuve trouve parmi la selection" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.deliverable.updateMany({
      where: { id: { in: deliverables.map((d) => d.id) } },
      data: { status: "DELIVERED" },
    });

    await tx.activity.createMany({
      data: deliverables.map((d) => ({
        type: "STATUS_CHANGED" as const,
        message: `marked "${d.title}" as delivered (bulk)`,
        userId: session.user.id,
        deliverableId: d.id,
      })),
    });
  });

  const ecIds = [...new Set(deliverables.map((d) => d.eventCompanyId))];
  for (const ecId of ecIds) {
    const titles = deliverables
      .filter((d) => d.eventCompanyId === ecId)
      .map((d) => d.title);
    await notifyClientUsers(
      ecId,
      "Livrables livres",
      `${titles.length} livrable${titles.length > 1 ? "s" : ""} livre${titles.length > 1 ? "s" : ""} : ${titles.join(", ")}`,
    );
  }

  revalidatePath("/admin/events");
  revalidatePath("/admin/deliverables");
  revalidatePath("/portal/deliverables");
  revalidatePath("/portal/dashboard");
  return { success: true, data: undefined };
}

export async function bulkDeleteDraft(
  type: "strategy" | "deliverable",
  ids: string[],
): Promise<ActionResult> {
  await requireAdmin();

  if (ids.length === 0) {
    return { success: false, error: "Aucun element selectionne" };
  }

  if (type === "strategy") {
    const strategies = await prisma.strategy.findMany({
      where: { id: { in: ids }, status: "DRAFT" },
      select: { id: true },
    });

    if (strategies.length === 0) {
      return { success: false, error: "Aucune strategie en brouillon trouvee parmi la selection" };
    }

    await prisma.strategy.deleteMany({
      where: { id: { in: strategies.map((s) => s.id) } },
    });

    revalidatePath("/admin/events");
    revalidatePath("/admin/strategies");
    revalidatePath("/portal/strategy");
    revalidatePath("/admin/dashboard");
  } else {
    const deliverables = await prisma.deliverable.findMany({
      where: { id: { in: ids }, status: "DRAFT" },
      select: { id: true },
    });

    if (deliverables.length === 0) {
      return { success: false, error: "Aucun livrable en brouillon trouve parmi la selection" };
    }

    await prisma.deliverable.deleteMany({
      where: { id: { in: deliverables.map((d) => d.id) } },
    });

    revalidatePath("/admin/events");
    revalidatePath("/admin/deliverables");
    revalidatePath("/portal/deliverables");
    revalidatePath("/admin/dashboard");
  }

  return { success: true, data: undefined };
}
