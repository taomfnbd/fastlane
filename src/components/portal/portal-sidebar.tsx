"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  Package,
  Clock,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

const navItems = [
  { label: "Tableau de bord", href: "/portal/dashboard", icon: LayoutDashboard },
  { label: "Strategie", href: "/portal/strategy", icon: Target },
  { label: "Livrables", href: "/portal/deliverables", icon: Package },
  { label: "Chronologie", href: "/portal/timeline", icon: Clock },
  { label: "Parametres", href: "/portal/settings", icon: Settings },
];

interface PortalSidebarProps {
  user: { name: string; email: string };
  companyName: string;
  collapsed: boolean;
  onToggle: () => void;
}

export function PortalSidebar({ user, companyName, collapsed, onToggle }: PortalSidebarProps) {
  const pathname = usePathname();

  function NavItem({ item }: { item: (typeof navItems)[0] }) {
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
        {!collapsed && <span>{item.label}</span>}
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
            <span className="text-sm font-semibold block">Fastlane</span>
            <span className="text-[11px] text-muted-foreground truncate block">{companyName}</span>
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
          <NavItem key={item.href} item={item} />
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
