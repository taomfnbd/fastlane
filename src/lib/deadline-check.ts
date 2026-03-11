import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { notifyAdmins, notifyClientUsers } from "@/lib/notify";

export async function checkDeadlines(): Promise<number> {
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const [strategies, deliverables] = await Promise.all([
    prisma.strategy.findMany({
      where: {
        dueDate: { gte: now, lte: in48h },
        status: { notIn: ["APPROVED"] },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        eventCompanyId: true,
        eventCompany: {
          select: {
            event: { select: { id: true } },
          },
        },
      },
    }),
    prisma.deliverable.findMany({
      where: {
        dueDate: { gte: now, lte: in48h },
        status: { notIn: ["APPROVED", "DELIVERED"] },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        eventCompanyId: true,
        eventCompany: {
          select: {
            event: { select: { id: true } },
          },
        },
      },
    }),
  ]);

  let count = 0;

  for (const strategy of strategies) {
    const formattedDate = format(strategy.dueDate!, "d MMMM yyyy 'a' HH:mm", { locale: fr });
    const message = `"${strategy.title}" arrive a echeance le ${formattedDate}.`;
    const link = `/admin/events/${strategy.eventCompany.event.id}/strategy`;

    await notifyAdmins(strategy.eventCompanyId, "Echeance proche", message, link);
    await notifyClientUsers(strategy.eventCompanyId, "Echeance proche", message, link);
    count++;
  }

  for (const deliverable of deliverables) {
    const formattedDate = format(deliverable.dueDate!, "d MMMM yyyy 'a' HH:mm", { locale: fr });
    const message = `"${deliverable.title}" arrive a echeance le ${formattedDate}.`;
    const link = `/admin/events/${deliverable.eventCompany.event.id}/deliverables`;

    await notifyAdmins(deliverable.eventCompanyId, "Echeance proche", message, link);
    await notifyClientUsers(deliverable.eventCompanyId, "Echeance proche", message, link);
    count++;
  }

  return count;
}
