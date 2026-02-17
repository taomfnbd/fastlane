"use client";

import { useState } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AppHeader } from "@/components/shared/app-header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  user: { name: string; email: string };
  notificationCount: number;
  children: React.ReactNode;
}

export function AdminShell({ user, notificationCount, children }: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar
          user={user}
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
      </div>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <AdminSidebar
            user={user}
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
