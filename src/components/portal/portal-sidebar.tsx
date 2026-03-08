"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  Package,
  MessageSquare,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";

const navItems = [
  { label: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard, countKey: null },
  { label: "Strategies", href: "/portal/strategy", icon: Target, countKey: "pendingStrategies" as const },
  { label: "Delivrables", href: "/portal/deliverables", icon: Package, countKey: "pendingDeliverables" as const },
  { label: "Contact", href: "/portal/contact", icon: MessageSquare, countKey: null },
];

interface PortalSidebarProps {
  user: { name: string; email: string };
  companyName: string;
  pendingCounts?: { pendingStrategies: number; pendingDeliverables: number };
}

export function PortalSidebar({ user, companyName, pendingCounts }: PortalSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b px-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          F
        </span>
        <span className="text-sm font-semibold">Fastlane</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const count = item.countKey && pendingCounts ? pendingCounts[item.countKey] : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {count > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/15 px-1.5 text-[11px] font-medium tabular-nums text-amber-500">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t px-3 py-3 space-y-1">
        <Link
          href="/portal/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
            pathname === "/portal/settings"
              ? "bg-primary/10 font-medium text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          Parametres
        </Link>
        <div className="px-3 py-2">
          <p className="text-xs font-medium truncate">{companyName}</p>
          <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
        </div>
        <button
          onClick={() => signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/login"; } } })}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Deconnexion
        </button>
      </div>
    </aside>
  );
}
