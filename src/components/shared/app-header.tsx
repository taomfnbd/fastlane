"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  user: { name: string; email: string };
  notificationCount?: number;
  onMobileMenuToggle?: () => void;
}

const labelMap: Record<string, string> = {
  admin: "Admin",
  portal: "Portal",
  dashboard: "Dashboard",
  events: "Events",
  companies: "Companies",
  deliverables: "Deliverables",
  users: "Users",
  settings: "Settings",
  strategy: "Strategy",
  timeline: "Timeline",
};

export function AppHeader({ user, notificationCount = 0, onMobileMenuToggle }: AppHeaderProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
      {/* Mobile menu button */}
      {onMobileMenuToggle && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 lg:hidden mr-2"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm min-w-0">
        {segments.map((segment, i) => {
          const isLast = i === segments.length - 1;
          const label = labelMap[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
          return (
            <span key={segment + i} className="flex items-center gap-1 min-w-0">
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />}
              <span
                className={cn(
                  "truncate",
                  isLast ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </span>
          );
        })}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          title="Search (Cmd+K)"
        >
          <Search className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground relative"
          title="Notifications"
        >
          <Bell className="h-3.5 w-3.5" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Button>

        <div className="ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
          {user.name.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
