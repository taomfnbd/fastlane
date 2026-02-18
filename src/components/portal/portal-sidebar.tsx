"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  Package,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}

interface PortalSidebarProps {
  user: { name: string; email: string };
  companyName: string;
  activeEventName: string | null;
  pendingStrategies: number;
  pendingDeliverables: number;
  collapsed: boolean;
  onToggle: () => void;
}

export function PortalSidebar({
  user,
  companyName,
  activeEventName,
  pendingStrategies,
  pendingDeliverables,
  collapsed,
  onToggle,
}: PortalSidebarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { label: "Accueil", href: "/portal/dashboard", icon: LayoutDashboard },
    { label: "Strategie", href: "/portal/strategy", icon: Target, badge: pendingStrategies },
    { label: "Livrables", href: "/portal/deliverables", icon: Package, badge: pendingDeliverables },
  ];

  const bottomItems: NavItem[] = [
    { label: "Parametres", href: "/portal/settings", icon: Settings },
  ];

  function NavItemLink({ item }: { item: NavItem }) {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors duration-150",
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
            {item.badge ? (
              <span className="text-xs font-medium tabular-nums text-amber-500">
                {item.badge}
              </span>
            ) : null}
          </>
        )}
        {collapsed && item.badge ? (
          <span className="absolute right-1 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
            {item.badge}
          </span>
        ) : null}
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
          <div className="min-w-0">
            <span className="text-sm font-semibold block truncate">{companyName}</span>
            {activeEventName && (
              <span className="text-[11px] text-muted-foreground truncate block">
                {activeEventName}
              </span>
            )}
          </div>
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
        {navItems.map((item) => (
          <div key={item.href} className="relative">
            <NavItemLink item={item} />
          </div>
        ))}
        <div className="my-2" />
        {bottomItems.map((item) => (
          <NavItemLink key={item.href} item={item} />
        ))}
      </nav>

      {/* User */}
      <div className="border-t px-2 py-3 space-y-1">
        {!collapsed && (
          <div className="px-2 mb-2">
            <p className="text-xs font-medium truncate">{user.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
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
