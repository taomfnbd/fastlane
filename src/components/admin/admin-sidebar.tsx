"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Building2,
  Package,
  Target,
  Users,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

const mainNav = [
  { label: "Tableau de bord", href: "/admin/dashboard", icon: LayoutDashboard, countKey: "unansweredQuestions" as const },
  { label: "Evenements", href: "/admin/events", icon: Calendar, countKey: "activeEvents" as const },
  { label: "Strategies", href: "/admin/strategies", icon: Target, countKey: "pendingStrategies" as const },
  { label: "Livrables", href: "/admin/deliverables", icon: Package, countKey: "pendingDeliverables" as const },
  { label: "Entreprises", href: "/admin/companies", icon: Building2 },
];

const workspaceNav = [
  { label: "Utilisateurs", href: "/admin/users", icon: Users },
  { label: "Parametres", href: "/admin/settings", icon: Settings },
];

interface AdminSidebarProps {
  user: { name: string; email: string };
  collapsed: boolean;
  onToggle: () => void;
  pendingCounts?: { pendingStrategies: number; pendingDeliverables: number; activeEvents: number; unansweredQuestions: number };
}

export function AdminSidebar({ user, collapsed, onToggle, pendingCounts }: AdminSidebarProps) {
  const pathname = usePathname();

  function NavItem({ item }: { item: (typeof mainNav)[0] }) {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    const count = item.countKey && pendingCounts ? pendingCounts[item.countKey] : 0;
    return (
      <Link
        href={item.href}
        className={cn(
          "relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors duration-150",
          isActive
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        )}
        title={collapsed ? item.label : undefined}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/15 px-1.5 text-[11px] font-medium text-amber-600 tabular-nums">
                {count}
              </span>
            )}
          </>
        )}
        {collapsed && count > 0 && (
          <span className="absolute right-1 top-0.5 h-2 w-2 rounded-full bg-amber-500" />
        )}
      </Link>
    );
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-background transition-all duration-150",
        collapsed ? "w-14" : "w-60"
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-3">
        {!collapsed && (
          <span className="text-sm font-semibold">Fastlane</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          onClick={onToggle}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-2 py-3">
        {mainNav.map((item) => (
          <NavItem key={item.href + item.label} item={item} />
        ))}

        {!collapsed && (
          <div className="my-3 px-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Espace de travail
            </span>
          </div>
        )}
        {collapsed && <div className="my-3 border-t" />}

        {workspaceNav.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}
      </nav>

      {/* User */}
      <div className="border-t px-2 py-3 space-y-1">
        {!collapsed && (
          <div className="px-2 mb-2">
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={() => signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/login"; } } })}
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:bg-accent/50 hover:text-foreground"
          title={collapsed ? "Deconnexion" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Deconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
