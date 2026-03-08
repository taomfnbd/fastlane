import { requireClient } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { relativeTime } from "@/lib/utils";
import { NotificationItem } from "@/components/portal/notification-item";
import { ArrowLeft, BellOff } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Notifications" };

type DateGroup = "AUJOURD'HUI" | "HIER" | "PLUS TOT";

function getDateGroup(date: Date): DateGroup {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (today.getTime() - msgDay.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "AUJOURD'HUI";
  if (diffDays === 1) return "HIER";
  return "PLUS TOT";
}

function getDotColor(notification: {
  read: boolean;
  link: string | null;
  title: string;
}): string {
  if (notification.read) return "bg-muted-foreground/30";

  const titleLower = notification.title.toLowerCase();
  if (
    titleLower.includes("approuve") ||
    titleLower.includes("valide") ||
    titleLower.includes("termine") ||
    titleLower.includes("livre")
  ) {
    return "bg-emerald-500";
  }
  if (
    titleLower.includes("question") ||
    titleLower.includes("revision") ||
    titleLower.includes("changement") ||
    titleLower.includes("action") ||
    titleLower.includes("attente")
  ) {
    return "bg-amber-500";
  }
  return "bg-blue-500";
}

export default async function NotificationsPage() {
  const session = await requireClient();

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      message: true,
      link: true,
      read: true,
      createdAt: true,
    },
  });

  // Group by date
  const groups = new Map<DateGroup, typeof notifications>();
  for (const n of notifications) {
    const group = getDateGroup(n.createdAt);
    const existing = groups.get(group) ?? [];
    existing.push(n);
    groups.set(group, existing);
  }

  const orderedGroups: DateGroup[] = ["AUJOURD'HUI", "HIER", "PLUS TOT"];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/portal/dashboard"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight">
            Notifications
          </h1>
          {notifications.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {notifications.filter((n) => !n.read).length} non lue
              {notifications.filter((n) => !n.read).length > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {/* Empty state */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <BellOff className="h-8 w-8" />
          <p className="text-sm font-medium">Aucune notification</p>
          <p className="text-xs">
            Vous serez notifie lorsque l&apos;equipe Fastlane interagit avec
            votre projet.
          </p>
        </div>
      ) : (
        orderedGroups.map((groupKey) => {
          const items = groups.get(groupKey);
          if (!items || items.length === 0) return null;

          return (
            <div key={groupKey}>
              <h2 className="text-xs font-medium uppercase tracking-wide text-primary mb-3">
                {groupKey}
              </h2>
              <div className="space-y-2">
                {items.map((n) => (
                  <NotificationItem
                    key={n.id}
                    id={n.id}
                    title={n.title}
                    message={n.message}
                    link={n.link}
                    read={n.read}
                    time={relativeTime(n.createdAt)}
                    dotColor={getDotColor(n)}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
