"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { relativeTime } from "@/lib/utils";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  notifications: Notification[];
  unreadCount: number;
}

export function NotificationBell({ notifications, unreadCount }: NotificationBellProps) {
  const [open, setOpen] = useState(false);

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
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-3 py-2.5 border-b">
          <p className="text-sm font-medium">Notifications</p>
          {unreadCount > 0 && (
            <p className="text-[11px] text-muted-foreground">
              {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
            </p>
          )}
        </div>

        {notifications.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            Aucune notification.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((n) => {
              const inner = (
                <>
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
                </>
              );

              return n.link ? (
                <Link
                  key={n.id}
                  href={n.link}
                  className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-accent/50 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {inner}
                </Link>
              ) : (
                <div key={n.id} className="flex items-start gap-2.5 px-3 py-2.5">
                  {inner}
                </div>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
