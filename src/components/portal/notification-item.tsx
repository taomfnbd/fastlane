"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAsRead } from "@/server/actions/notifications";

interface NotificationItemProps {
  id: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  time: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  dotColor: string;
}

export function NotificationItem({
  id,
  title,
  message,
  link,
  read,
  time,
  icon,
  iconBg,
  iconColor,
  dotColor,
}: NotificationItemProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      if (!read) {
        await markAsRead(id);
      }
      if (link) {
        router.push(link);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="flex w-full items-center gap-4 bg-card p-4 rounded-xl border border-primary/5 shadow-sm text-left transition-all hover:shadow-md"
    >
      {/* Colored icon square */}
      <div className={`flex items-center justify-center h-12 w-12 rounded-lg ${iconBg} ${iconColor} shrink-0`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-foreground truncate">{title}</p>
          {dotColor && (
            <div className={`h-2 w-2 rounded-full shrink-0 ${dotColor}`} />
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{time}</p>
      </div>
    </button>
  );
}
