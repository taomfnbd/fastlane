import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";

function fireEmails(users: { email: string }[], title: string, message: string, link?: string) {
  for (const user of users) {
    void sendNotificationEmail(user.email, title, message, link);
  }
}

/**
 * Notify all ADMIN / SUPER_ADMIN users of the tenant that owns the eventCompany.
 */
export async function notifyAdmins(
  eventCompanyId: string,
  title: string,
  message: string,
  link?: string,
) {
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    select: { id: true, email: true },
  });

  if (admins.length === 0) return;

  await prisma.notification.createMany({
    data: admins.map((u) => ({
      title,
      message,
      link: link ?? null,
      userId: u.id,
    })),
  });

  fireEmails(admins, title, message, link);
}

/**
 * Notify CLIENT_ADMIN / CLIENT_MEMBER users of the company linked to an eventCompany.
 */
export async function notifyClientUsers(
  eventCompanyId: string,
  title: string,
  message: string,
  link?: string,
) {
  const ec = await prisma.eventCompany.findUnique({
    where: { id: eventCompanyId },
    include: {
      company: {
        include: {
          users: {
            where: { role: { in: ["CLIENT_ADMIN", "CLIENT_MEMBER"] } },
            select: { id: true, email: true },
          },
        },
      },
    },
  });

  const clientUsers = ec?.company.users ?? [];
  if (clientUsers.length === 0) return;

  await prisma.notification.createMany({
    data: clientUsers.map((u) => ({
      title,
      message,
      link: link ?? null,
      userId: u.id,
    })),
  });

  fireEmails(clientUsers, title, message, link);
}

/**
 * Notify CLIENT_ADMIN / CLIENT_MEMBER users of a company directly (no eventCompany lookup).
 * Use when you only have a companyId, not an eventCompanyId.
 */
export async function notifyCompanyUsers(
  companyId: string,
  title: string,
  message: string,
  link?: string,
) {
  const clientUsers = await prisma.user.findMany({
    where: {
      companyId,
      role: { in: ["CLIENT_ADMIN", "CLIENT_MEMBER"] },
    },
    select: { id: true, email: true },
  });

  if (clientUsers.length === 0) return;

  await prisma.notification.createMany({
    data: clientUsers.map((u) => ({
      title,
      message,
      link: link ?? null,
      userId: u.id,
    })),
  });

  fireEmails(clientUsers, title, message, link);
}

/**
 * When someone comments, notify the "other side":
 * - If author is client -> notify admins
 * - If author is admin  -> notify client users of the related company
 */
export async function notifyCommentParties(
  authorId: string,
  entityType: "strategy" | "deliverable",
  entityId: string,
  message: string,
  link?: string,
) {
  const author = await prisma.user.findUnique({
    where: { id: authorId },
    select: { role: true },
  });
  if (!author) return;

  const isAuthorAdmin = author.role === "ADMIN" || author.role === "SUPER_ADMIN";

  // Find the eventCompanyId from the entity
  let eventCompanyId: string | null = null;

  if (entityType === "strategy") {
    const strategy = await prisma.strategy.findUnique({
      where: { id: entityId },
      select: { eventCompanyId: true },
    });
    eventCompanyId = strategy?.eventCompanyId ?? null;
  } else {
    const deliverable = await prisma.deliverable.findUnique({
      where: { id: entityId },
      select: { eventCompanyId: true },
    });
    eventCompanyId = deliverable?.eventCompanyId ?? null;
  }

  if (!eventCompanyId) return;

  if (isAuthorAdmin) {
    await notifyClientUsers(eventCompanyId, "Nouveau commentaire", message, link);
  } else {
    await notifyAdmins(eventCompanyId, "Nouveau commentaire", message, link);
  }
}
