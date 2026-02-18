"use client";

import { useState } from "react";
import { PortalTopnav } from "./portal-topnav";
import { MobileNavSheet } from "./mobile-nav-sheet";
import { NotificationBell } from "./notification-bell";

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
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <PortalTopnav
        user={user}
        companyName={companyName}
        pendingStrategies={pendingStrategies}
        pendingDeliverables={pendingDeliverables}
        notificationSlot={
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
          />
        }
        onMobileMenuOpen={() => setMobileOpen(true)}
      />

      <MobileNavSheet
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        pendingStrategies={pendingStrategies}
        pendingDeliverables={pendingDeliverables}
      />

      <main className="mx-auto max-w-4xl px-4 py-6 lg:px-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}
