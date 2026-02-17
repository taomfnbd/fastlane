"use client";

import { useState } from "react";
import { PortalSidebar } from "./portal-sidebar";
import { AppHeader } from "@/components/shared/app-header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface PortalShellProps {
  user: { name: string; email: string };
  companyName: string;
  notificationCount: number;
  children: React.ReactNode;
}

export function PortalShell({ user, companyName, notificationCount, children }: PortalShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <PortalSidebar
          user={user}
          companyName={companyName}
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
          notificationCount={notificationCount}
          onMobileMenuToggle={() => setMobileOpen(true)}
        />
        <main className="px-4 py-4 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
