import { requireClient } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { relativeTime } from "@/lib/utils";
import { NotificationItem } from "@/components/portal/notification-item";
import { MarkAllReadButton } from "@/components/portal/mark-all-read-button";
import Link from "next/link";

export const metadata = { title: "Notifications" };

type DateGroup = "AUJOURD'HUI" | "HIER" | "PLUS TÔT";

function getDateGroup(date: Date): DateGroup {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (today.getTime() - msgDay.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "AUJOURD'HUI";
  if (diffDays === 1) return "HIER";
  return "PLUS TÔT";
}

function getNotificationStyle(title: string, read: boolean) {
  const t = title.toLowerCase();

  if (
    t.includes("approuve") ||
    t.includes("valide") ||
    t.includes("termine") ||
    t.includes("livre")
  ) {
    return {
      icon: "check_circle",
      iconBg: "bg-green-500/10",
      iconColor: "text-green-500",
      dotColor: read ? "" : "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]",
    };
  }

  if (
    t.includes("question") ||
    t.includes("attente") ||
    t.includes("changement") ||
    t.includes("audit") ||
    t.includes("recu") ||
    t.includes("modification")
  ) {
    return {
      icon: "description",
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-500",
      dotColor: read ? "" : "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]",
    };
  }

  return {
    icon: "lightbulb",
    iconBg: "bg-primary/10",
    iconColor: "text-[#6961ff]",
    dotColor: read ? "" : "bg-[#6961ff] shadow-[0_0_8px_rgba(105,97,255,0.6)]",
  };
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

  const orderedGroups: DateGroup[] = ["AUJOURD'HUI", "HIER", "PLUS TÔT"];

  return (
    <div className="space-y-6 animate-fade-up max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/portal/dashboard"
          className="flex items-center justify-center h-10 w-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors border border-red-500/20 shadow-sm shadow-red-500/10"
        >
          <span className="material-symbols-outlined">close</span>
        </Link>
        <div className="space-y-0.5 flex-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Notifications
          </h1>
          {notifications.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {notifications.filter((n) => !n.read).length} non lue
              {notifications.filter((n) => !n.read).length > 1 ? "s" : ""}
            </p>
          )}
        </div>
        {notifications.some((n) => !n.read) && <MarkAllReadButton />}
      </div>

      {/* Empty state */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <span className="material-symbols-outlined text-3xl">notifications_off</span>
          <p className="text-sm font-medium">Aucune notification</p>
          <p className="text-xs">
            Vous serez notifié lorsque l&apos;équipe Fastlane interagit avec
            votre projet.
          </p>
        </div>
      ) : (
        orderedGroups.map((groupKey) => {
          const items = groups.get(groupKey);
          if (!items || items.length === 0) return null;

          return (
            <div key={groupKey}>
              <h2 className="text-xs font-bold uppercase tracking-widest text-primary/60 mb-4 px-1">
                {groupKey}
              </h2>
              <div className="space-y-3">
                {items.map((n) => {
                  const style = getNotificationStyle(n.title, n.read);
                  return (
                    <NotificationItem
                      key={n.id}
                      id={n.id}
                      title={n.title}
                      message={n.message}
                      link={n.link}
                      read={n.read}
                      time={relativeTime(n.createdAt)}
                      icon={style.icon}
                      iconBg={style.iconBg}
                      iconColor={style.iconColor}
                      dotColor={style.dotColor}
                    />
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
