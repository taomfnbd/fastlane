"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { createEventSchema, updateEventSchema } from "@/types";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

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

  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}`);
  revalidatePath("/admin/dashboard");

  return { success: true, data: undefined };
}

export async function deleteEvent(eventId: string): Promise<ActionResult> {
  await requireAdmin();

  await prisma.event.delete({ where: { id: eventId } });

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

  await prisma.eventCompany.create({
    data: { eventId, companyId },
  });

  revalidatePath(`/admin/events/${eventId}`);

  return { success: true, data: undefined };
}

export async function removeCompanyFromEvent(
  eventId: string,
  companyId: string
): Promise<ActionResult> {
  await requireAdmin();

  await prisma.eventCompany.delete({
    where: { eventId_companyId: { eventId, companyId } },
  });

  revalidatePath(`/admin/events/${eventId}`);

  return { success: true, data: undefined };
}
