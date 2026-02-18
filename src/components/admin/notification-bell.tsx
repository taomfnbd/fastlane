"use client";

import { useState, useOptimistic, useTransition } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { relativeTime } from "@/lib/utils";
import { markAsRead, markAllAsRead } from "@/server/actions/notifications";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface AdminNotificationBellProps {
  notifications: Notification[];
  unreadCount: number;
}

export function AdminNotificationBell({ notifications, unreadCount }: AdminNotificationBellProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticNotifs, setOptimisticNotifs] = useOptimistic(
    notifications,
    (state, action: { type: "readOne"; id: string } | { type: "readAll" }) => {
      if (action.type === "readAll") {
        return state.map((n) => ({ ...n, read: true }));
      }
      return state.map((n) => (n.id === action.id ? { ...n, read: true } : n));
    },
  );

  const optimisticUnread = optimisticNotifs.filter((n) => !n.read).length;

  function handleNotificationClick(n: Notification) {
    setOpen(false);
    if (!n.read) {
      startTransition(async () => {
        setOptimisticNotifs({ type: "readOne", id: n.id });
        await markAsRead(n.id);
      });
    }
    if (n.link) {
      router.push(n.link);
    }
  }

  function handleMarkAllAsRead() {
    startTransition(async () => {
      setOptimisticNotifs({ type: "readAll" });
      await markAllAsRead();
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground relative"
          title="Notifications"
        >
          <Bell className="h-3.5 w-3.5" />
          {optimisticUnread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
              {optimisticUnread > 9 ? "9+" : optimisticUnread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-3 py-2.5 border-b flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Notifications</p>
            {optimisticUnread > 0 && (
              <p className="text-[11px] text-muted-foreground">
                {optimisticUnread} non lue{optimisticUnread > 1 ? "s" : ""}
              </p>
            )}
          </div>
          {optimisticUnread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllAsRead}
              disabled={isPending}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Tout lire
            </Button>
          )}
        </div>

        {optimisticNotifs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            Aucune notification.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {optimisticNotifs.map((n) => (
              <button
                key={n.id}
                type="button"
                className="flex w-full items-start gap-2.5 px-3 py-2.5 hover:bg-accent/50 transition-colors text-left"
                onClick={() => handleNotificationClick(n)}
              >
                <div
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    n.read ? "bg-muted-foreground/20" : "bg-blue-500"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">{n.title}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{n.message}</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                    {relativeTime(n.createdAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
