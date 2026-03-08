"use client";

import { PortalSidebar } from "./portal-sidebar";
import { PortalBottomNav } from "./portal-bottom-nav";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import Link from "next/link";
import { Bell } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface PortalShellProps {
  user: { name: string; email: string };
  companyName: string;
  activeEventName: string | null;
  notifications: Notification[];
  unreadCount: number;
  pendingStrategies: number;
  pendingDeliverables: number;
  children: React.ReactNode;
}

export function PortalShell({
  user,
  companyName,
  notifications,
  unreadCount,
  pendingStrategies,
  pendingDeliverables,
  children,
}: PortalShellProps) {
  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <PortalSidebar
          user={user}
          companyName={companyName}
          pendingCounts={{ pendingStrategies, pendingDeliverables }}
        />
      </div>

      {/* Main area */}
      <div className="lg:pl-56">
        {/* Top bar with notification bell */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-end gap-2 border-b bg-background/80 px-4 backdrop-blur-sm lg:px-6">
          <ThemeToggle />
          <Link
            href="/portal/notifications"
            className="relative flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </header>

        <main className="px-4 py-6 pb-20 lg:px-8 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <PortalBottomNav
        pendingStrategies={pendingStrategies}
        pendingDeliverables={pendingDeliverables}
      />
    </div>
  );
}
