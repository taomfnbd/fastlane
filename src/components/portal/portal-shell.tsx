"use client";

import { PortalSidebar } from "./portal-sidebar";
import { PortalBottomNav } from "./portal-bottom-nav";
import Link from "next/link";

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
  unansweredQuestions: number;
  children: React.ReactNode;
}

export function PortalShell({
  user,
  companyName,
  unreadCount,
  pendingStrategies,
  pendingDeliverables,
  unansweredQuestions,
  children,
}: PortalShellProps) {
  return (
    <div className="portal-theme min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <PortalSidebar
          user={user}
          companyName={companyName}
          pendingCounts={{ pendingStrategies, pendingDeliverables, unansweredQuestions }}
        />
      </div>

      {/* Mobile header */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between px-5 bg-background/80 backdrop-blur-md border-b border-primary/5 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#fefce8] flex items-center justify-center overflow-hidden">
            <span className="text-sm font-bold text-[#6961ff]">F</span>
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">Fastlane</span>
        </div>
        <Link
          href="/portal/notifications"
          className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#6961ff] ring-2 ring-background" />
          )}
        </Link>
      </header>

      {/* Main area */}
      <div className="lg:pl-72">
        {/* Desktop notification bar */}
        <div className="hidden lg:flex items-center justify-end px-10 pt-6 pb-0">
          <Link
            href="/portal/notifications"
            className="relative p-2 rounded-xl bg-card hover:bg-accent transition-colors border border-primary/5"
          >
            <span className="material-symbols-outlined text-muted-foreground text-2xl">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#6961ff] ring-2 ring-card" />
            )}
          </Link>
        </div>

        <main className="px-5 py-6 pb-24 lg:px-10 lg:py-6 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <PortalBottomNav
        pendingStrategies={pendingStrategies}
        pendingDeliverables={pendingDeliverables}
        unansweredQuestions={unansweredQuestions}
      />
    </div>
  );
}
