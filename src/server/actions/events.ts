"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { createEventSchema, updateEventSchema } from "@/types";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import { notifyCompanyUsers } from "@/lib/notify";

export async function createEvent(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const session = await requireAdmin();

  const parsed = createEventSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, description, startDate, endDate } = parsed.data;

  if (new Date(endDate) <= new Date(startDate)) {
    return { success: false, error: "End date must be after start date" };
  }

  const event = await prisma.event.create({
    data: {
      name,
      description: description ?? null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });

  await prisma.activity.create({
    data: {
      type: "STATUS_CHANGED",
      message: `created event "${name}"`,
      userId: session.user.id,
    },
  });

  revalidatePath("/admin/events");
  revalidatePath("/admin/dashboard");

  return { success: true, data: { id: event.id } };
}

export async function updateEvent(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = updateEventSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    status: formData.get("status") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { id, name, description, startDate, endDate, status } = parsed.data;

  if (new Date(endDate) <= new Date(startDate)) {
    return { success: false, error: "End date must be after start date" };
  }

  const existing = await prisma.event.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!existing) return { success: false, error: "Event not found" };

  await prisma.event.update({
    where: { id },
    data: {
      name,
      description: description ?? null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      ...(status ? { status } : {}),
    },
  });

  // Notify all companies in this event when status changes
  if (status && status !== existing.status) {
    const eventCompanies = await prisma.eventCompany.findMany({
      where: { eventId: id },
      select: { companyId: true },
    });
    for (const ec of eventCompanies) {
      await notifyCompanyUsers(
        ec.companyId,
        "Mise a jour evenement",
        `L'evenement "${name}" est maintenant en statut ${status === "ACTIVE" ? "actif" : status === "COMPLETED" ? "termine" : status.toLowerCase()}.`,
        "/portal/dashboard",
      );
    }
  }

  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}`);
  revalidatePath("/admin/dashboard");
  revalidatePath("/portal/dashboard");

  return { success: true, data: undefined };
}

export async function deleteEvent(eventId: string): Promise<ActionResult> {
  await requireAdmin();

  try {
    await prisma.event.delete({ where: { id: eventId } });
  } catch {
    return { success: false, error: "Impossible de supprimer cet evenement" };
  }

  revalidatePath("/admin/events");
  revalidatePath("/admin/dashboard");

  return { success: true, data: undefined };
}

export async function addCompanyToEvent(
  eventId: string,
  companyId: string
): Promise<ActionResult> {
  await requireAdmin();

  const existing = await prisma.eventCompany.findUnique({
    where: { eventId_companyId: { eventId, companyId } },
  });

  if (existing) {
    return { success: false, error: "Company is already part of this event" };
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { name: true },
  });

  await prisma.eventCompany.create({
    data: { eventId, companyId },
  });

  // Notify client users they've been added to the event
  await notifyCompanyUsers(
    companyId,
    "Nouvel evenement",
    `Votre entreprise a ete ajoutee a l'evenement "${event?.name ?? ""}".`,
    "/portal/dashboard",
  );

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/portal/dashboard");

  return { success: true, data: undefined };
}

export async function removeCompanyFromEvent(
  eventId: string,
  companyId: string
): Promise<ActionResult> {
  await requireAdmin();

  try {
    await prisma.eventCompany.delete({
      where: { eventId_companyId: { eventId, companyId } },
    });
  } catch {
    return { success: false, error: "Association introuvable" };
  }

  revalidatePath(`/admin/events/${eventId}`);

  return { success: true, data: undefined };
}
