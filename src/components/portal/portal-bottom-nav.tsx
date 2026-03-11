"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { label: "Dashboard", href: "/portal/dashboard", icon: "dashboard" },
  { label: "Stratégies", href: "/portal/strategy", icon: "ads_click" },
  { label: "Délivrables", href: "/portal/deliverables", icon: "inventory_2" },
  { label: "Contact", href: "/portal/contact", icon: "chat_bubble" },
];

interface PortalBottomNavProps {
  pendingStrategies: number;
  pendingDeliverables: number;
  unansweredQuestions: number;
}

export function PortalBottomNav({ pendingStrategies, pendingDeliverables, unansweredQuestions }: PortalBottomNavProps) {
  const pathname = usePathname();

  const badges: Record<string, number> = {
    "/portal/strategy": pendingStrategies,
    "/portal/deliverables": pendingDeliverables,
    "/portal/contact": unansweredQuestions,
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 bg-background/95 backdrop-blur-xl border-t border-primary/5 px-2 pb-6 pt-3 lg:hidden shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const badge = badges[item.href] ?? 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1.5 flex-1 group transition-colors",
                isActive ? "text-[#6961ff]" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <span className="material-symbols-outlined text-[26px] group-hover:scale-110 transition-transform">
                  {item.icon}
                </span>
                {badge > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[8px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] uppercase tracking-widest",
                isActive ? "font-bold" : "font-medium"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
