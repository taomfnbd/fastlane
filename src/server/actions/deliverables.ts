"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, getSession, getUserWithRole, isAdmin } from "@/lib/auth-server";
import { createDeliverableSchema, updateDeliverableSchema } from "@/types";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import { notifyAdmins, notifyClientUsers } from "@/lib/notify";

export async function createDeliverable(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const session = await requireAdmin();

  const parsed = createDeliverableSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    type: formData.get("type"),
    eventCompanyId: formData.get("eventCompanyId"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const deliverable = await prisma.deliverable.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      type: parsed.data.type,
      eventCompanyId: parsed.data.eventCompanyId,
    },
  });

  await prisma.activity.create({
    data: {
      type: "DELIVERABLE_CREATED",
      message: `created deliverable "${parsed.data.title}"`,
      userId: session.user.id,
      deliverableId: deliverable.id,
    },
  });

  revalidatePath("/admin/events");
  return { success: true, data: { id: deliverable.id } };
}

export async function submitDeliverableForReview(deliverableId: string): Promise<ActionResult> {
  const session = await requireAdmin();

  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    select: { id: true, title: true, status: true, eventCompanyId: true },
  });

  if (!deliverable) return { success: false, error: "Deliverable not found" };
  if (deliverable.status !== "DRAFT") {
    return { success: false, error: "Le livrable doit etre en brouillon pour etre soumis" };
  }

  await prisma.deliverable.update({
    where: { id: deliverableId },
    data: { status: "IN_REVIEW" },
  });

  await prisma.activity.create({
    data: {
      type: "DELIVERABLE_SUBMITTED",
      message: `submitted "${deliverable.title}" for review`,
      userId: session.user.id,
      deliverableId: deliverable.id,
    },
  });

  await notifyClientUsers(
    deliverable.eventCompanyId,
    "Livrable soumis",
    `"${deliverable.title}" est pret pour votre validation.`,
    `/portal/deliverables/${deliverable.id}`,
  );

  revalidatePath("/admin/events");
  revalidatePath("/portal/deliverables");
  revalidatePath("/portal/dashboard");
  return { success: true, data: undefined };
}

export async function approveDeliverable(deliverableId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    include: { eventCompany: { select: { companyId: true, id: true } } },
  });

  if (!deliverable) return { success: false, error: "Not found" };

  // Only allow approval from valid review states
  if (deliverable.status !== "IN_REVIEW" && deliverable.status !== "CHANGES_REQUESTED") {
    return { success: false, error: "Le livrable doit etre en revision pour etre approuve" };
  }

  const user = await getUserWithRole(session.user.id);
  if (!user) return { success: false, error: "User not found" };

  if (!isAdmin(user.role) && user.companyId !== deliverable.eventCompany.companyId) {
    return { success: false, error: "Access denied" };
  }

  await prisma.deliverable.update({
    where: { id: deliverableId },
    data: { status: "APPROVED" },
  });

  await prisma.activity.create({
    data: {
      type: "DELIVERABLE_APPROVED",
      message: `approved deliverable "${deliverable.title}"`,
      userId: session.user.id,
      deliverableId: deliverable.id,
    },
  });

  // Notify admins when client approves
  if (!isAdmin(user.role)) {
    await notifyAdmins(
      deliverable.eventCompany.id,
      "Livrable approuve",
      `Le client a approuve "${deliverable.title}".`,
      `/admin/events`,
    );
  }

  revalidatePath("/admin/events");
  revalidatePath("/portal/deliverables");
  revalidatePath(`/portal/deliverables/${deliverableId}`);
  return { success: true, data: undefined };
}

export async function requestDeliverableChanges(deliverableId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    include: { eventCompany: { select: { companyId: true, id: true } } },
  });

  if (!deliverable) return { success: false, error: "Not found" };

  // Only allow change requests from valid review states
  if (deliverable.status !== "IN_REVIEW") {
    return { success: false, error: "Le livrable n'est pas dans un etat qui permet des modifications" };
  }

  const user = await getUserWithRole(session.user.id);
  if (!user) return { success: false, error: "User not found" };

  if (!isAdmin(user.role) && user.companyId !== deliverable.eventCompany.companyId) {
    return { success: false, error: "Access denied" };
  }

  await prisma.deliverable.update({
    where: { id: deliverableId },
    data: { status: "CHANGES_REQUESTED" },
  });

  await prisma.activity.create({
    data: {
      type: "DELIVERABLE_REJECTED",
      message: `requested changes on "${deliverable.title}"`,
      userId: session.user.id,
      deliverableId: deliverable.id,
    },
  });

  // Notify admins when client requests changes
  if (!isAdmin(user.role)) {
    await notifyAdmins(
      deliverable.eventCompany.id,
      "Modifications demandees",
      `Le client demande des modifications sur "${deliverable.title}".`,
      `/admin/events`,
    );
  }

  revalidatePath("/admin/events");
  revalidatePath("/portal/deliverables");
  revalidatePath(`/portal/deliverables/${deliverableId}`);
  return { success: true, data: undefined };
}

export async function updateDeliverable(formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = updateDeliverableSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    type: formData.get("type"),
    content: formData.get("content") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const deliverable = await prisma.deliverable.findUnique({
    where: { id: parsed.data.id },
    select: { id: true },
  });
  if (!deliverable) return { success: false, error: "Deliverable not found" };

  await prisma.deliverable.update({
    where: { id: parsed.data.id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      type: parsed.data.type,
      ...(parsed.data.content !== undefined ? { content: { text: parsed.data.content } } : {}),
    },
  });

  await prisma.activity.create({
    data: {
      type: "DELIVERABLE_SUBMITTED",
      message: `updated deliverable "${parsed.data.title}"`,
      userId: session.user.id,
      deliverableId: parsed.data.id,
    },
  });

  revalidatePath("/admin/events");
  revalidatePath("/admin/deliverables");
  revalidatePath("/portal/deliverables");
  return { success: true, data: undefined };
}

export async function resubmitDeliverable(deliverableId: string): Promise<ActionResult> {
  const session = await requireAdmin();

  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    select: { id: true, title: true, status: true, version: true, eventCompanyId: true },
  });

  if (!deliverable) return { success: false, error: "Deliverable not found" };
  if (deliverable.status !== "CHANGES_REQUESTED") {
    return { success: false, error: "Deliverable must be in CHANGES_REQUESTED status to resubmit" };
  }

  await prisma.deliverable.update({
    where: { id: deliverableId },
    data: {
      status: "IN_REVIEW",
      version: { increment: 1 },
    },
  });

  await prisma.activity.create({
    data: {
      type: "DELIVERABLE_SUBMITTED",
      message: `resubmitted "${deliverable.title}" (v${deliverable.version + 1})`,
      userId: session.user.id,
      deliverableId,
    },
  });

  await notifyClientUsers(
    deliverable.eventCompanyId,
    "Livrable revise",
    `"${deliverable.title}" a ete revise et soumis a nouveau (v${deliverable.version + 1}).`,
    `/portal/deliverables/${deliverableId}`,
  );

  revalidatePath("/admin/events");
  revalidatePath("/admin/deliverables");
  revalidatePath("/portal/deliverables");
  revalidatePath("/portal/dashboard");
  return { success: true, data: undefined };
}

export async function markDeliverableDelivered(deliverableId: string): Promise<ActionResult> {
  const session = await requireAdmin();

  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    select: { id: true, title: true, status: true, eventCompanyId: true },
  });

  if (!deliverable) return { success: false, error: "Deliverable not found" };
  if (deliverable.status !== "APPROVED") {
    return { success: false, error: "Deliverable must be APPROVED before marking as delivered" };
  }

  await prisma.deliverable.update({
    where: { id: deliverableId },
    data: { status: "DELIVERED" },
  });

  await prisma.activity.create({
    data: {
      type: "STATUS_CHANGED",
      message: `marked "${deliverable.title}" as delivered`,
      userId: session.user.id,
      deliverableId,
    },
  });

  await notifyClientUsers(
    deliverable.eventCompanyId,
    "Livrable livre",
    `"${deliverable.title}" a ete livre.`,
    `/portal/deliverables/${deliverableId}`,
  );

  revalidatePath("/admin/events");
  revalidatePath("/admin/deliverables");
  revalidatePath("/portal/deliverables");
  revalidatePath("/portal/dashboard");
  return { success: true, data: undefined };
}
