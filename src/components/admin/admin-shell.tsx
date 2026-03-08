"use client";

import { useState } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminNotificationBell } from "./notification-bell";
import { AppHeader } from "@/components/shared/app-header";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { CommandPalette } from "./command-palette";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";

interface Notification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface AdminShellProps {
  user: { name: string; email: string };
  notifications: Notification[];
  unreadCount: number;
  pendingCounts: { pendingStrategies: number; pendingDeliverables: number; activeEvents: number; unansweredQuestions: number };
  children: React.ReactNode;
}

export function AdminShell({ user, notifications, unreadCount, pendingCounts, children }: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar-collapsed") === "true";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar
          user={user}
          collapsed={collapsed}
          onToggle={toggleCollapsed}
          pendingCounts={pendingCounts}
        />
      </div>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <AdminSidebar
            user={user}
            collapsed={false}
            onToggle={() => setMobileOpen(false)}
            pendingCounts={pendingCounts}
          />
        </SheetContent>
      </Sheet>

      {/* Main area */}
      <div
        className={cn(
          "transition-[padding] duration-150",
          collapsed ? "lg:pl-14" : "lg:pl-60"
        )}
      >
        <AppHeader
          user={user}
          onMobileMenuToggle={() => setMobileOpen(true)}
          themeToggleSlot={<ThemeToggle />}
          onSignOut={() => signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/login"; } } })}
          notificationSlot={
            <AdminNotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
            />
          }
        />
        <main className="px-4 py-4 lg:px-6">{children}</main>
      </div>

      <CommandPalette />
    </div>
  );
}
