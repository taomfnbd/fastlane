"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";

const navItems = [
  { label: "Dashboard", href: "/portal/dashboard", icon: "dashboard", countKey: null },
  { label: "Stratégies", href: "/portal/strategy", icon: "ads_click", countKey: "pendingStrategies" as const },
  { label: "Délivrables", href: "/portal/deliverables", icon: "inventory_2", countKey: "pendingDeliverables" as const },
  { label: "Contact", href: "/portal/contact", icon: "chat_bubble", countKey: "unansweredQuestions" as const },
];

interface PortalSidebarProps {
  user: { name: string; email: string };
  companyName: string;
  pendingCounts?: { pendingStrategies: number; pendingDeliverables: number; unansweredQuestions: number };
}

export function PortalSidebar({ user, companyName, pendingCounts }: PortalSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-background border-r border-primary/5 py-8 px-6 shadow-portal-card">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden">
          <span className="text-sm font-bold text-[#6961ff]">F</span>
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground">Fastlane</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const count = item.countKey && pendingCounts ? pendingCounts[item.countKey] : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                isActive
                  ? "bg-primary/10 text-[#6961ff] border border-primary/20"
                  : "text-muted-foreground hover:bg-card hover:text-foreground"
              )}
            >
              <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">
                {item.icon}
              </span>
              <span className={cn(
                "font-bold uppercase text-[11px] tracking-widest flex-1",
                isActive && "text-[#6961ff]"
              )}>
                {item.label}
              </span>
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
      <div className="space-y-2">
        <Link
          href="/portal/settings"
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
            pathname === "/portal/settings"
              ? "bg-primary/10 text-[#6961ff]"
              : "text-muted-foreground hover:bg-card hover:text-foreground"
          )}
        >
          <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">settings</span>
          <span className="font-bold uppercase text-[11px] tracking-widest">Paramètres</span>
        </Link>

        {/* User profile card */}
        <div className="bg-card rounded-2xl p-4 border border-primary/5 mt-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-[#6961ff] font-bold text-sm shrink-0">
              {companyName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground truncate">{companyName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/login"; } } })}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground transition-all hover:bg-card hover:text-foreground group"
        >
          <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">logout</span>
          <span className="font-bold uppercase text-[11px] tracking-widest">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
