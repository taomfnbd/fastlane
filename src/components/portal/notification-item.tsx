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
  dotColor: string;
}

export function NotificationItem({
  id,
  title,
  message,
  link,
  read,
  time,
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
      className="flex w-full items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-accent/50"
    >
      <span
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColor}`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {message}
        </p>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
        {time}
      </span>
    </button>
  );
}
