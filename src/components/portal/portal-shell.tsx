"use client";

import { useState } from "react";
import { PortalSidebar } from "./portal-sidebar";
import { AppHeader } from "@/components/shared/app-header";
import { NotificationBell } from "./notification-bell";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

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
  activeEventName,
  notifications,
  unreadCount,
  pendingStrategies,
  pendingDeliverables,
  children,
}: PortalShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <PortalSidebar
          user={user}
          companyName={companyName}
          activeEventName={activeEventName}
          pendingStrategies={pendingStrategies}
          pendingDeliverables={pendingDeliverables}
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
      </div>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <PortalSidebar
            user={user}
            companyName={companyName}
            activeEventName={activeEventName}
            pendingStrategies={pendingStrategies}
            pendingDeliverables={pendingDeliverables}
            collapsed={false}
            onToggle={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main area */}
      <div
        className={cn(
          "transition-all duration-150",
          collapsed ? "lg:pl-14" : "lg:pl-60"
        )}
      >
        <AppHeader
          user={user}
          onMobileMenuToggle={() => setMobileOpen(true)}
          notificationSlot={
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
            />
          }
        />
        <main className="px-4 py-4 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
