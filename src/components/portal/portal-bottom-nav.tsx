"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Target, Package, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
  { label: "Strategies", href: "/portal/strategy", icon: Target },
  { label: "Delivrables", href: "/portal/deliverables", icon: Package },
  { label: "Contact", href: "/portal/contact", icon: MessageSquare },
];

interface PortalBottomNavProps {
  pendingStrategies: number;
  pendingDeliverables: number;
}

export function PortalBottomNav({ pendingStrategies, pendingDeliverables }: PortalBottomNavProps) {
  const pathname = usePathname();

  const badges: Record<string, number> = {
    "/portal/strategy": pendingStrategies,
    "/portal/deliverables": pendingDeliverables,
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur-sm lg:hidden">
      <div className="flex h-16 items-center justify-around">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const badge = badges[item.href] ?? 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-1 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {badge > 0 && (
                  <span className="absolute -right-1.5 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-500 px-1 text-[8px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </div>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
