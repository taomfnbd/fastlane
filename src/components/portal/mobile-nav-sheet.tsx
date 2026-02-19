"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Target, Package, Clock, Settings, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";
import { VisuallyHidden } from "radix-ui";

interface MobileNavSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingStrategies: number;
  pendingDeliverables: number;
}

export function MobileNavSheet({
  open,
  onOpenChange,
  pendingStrategies,
  pendingDeliverables,
}: MobileNavSheetProps) {
  const pathname = usePathname();

  const items = [
    { label: "Accueil", href: "/portal/dashboard", icon: LayoutDashboard, badge: 0 },
    { label: "Strategies", href: "/portal/strategy", icon: Target, badge: pendingStrategies },
    { label: "Livrables", href: "/portal/deliverables", icon: Package, badge: pendingDeliverables },
    { label: "Activite", href: "/portal/timeline", icon: Clock, badge: 0 },
    { label: "Parametres", href: "/portal/settings", icon: Settings, badge: 0 },
  ];

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[60vh]"
        showCloseButton={false}
      >
        <VisuallyHidden.Root>
          <SheetTitle>Navigation</SheetTitle>
        </VisuallyHidden.Root>
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="h-1 w-8 rounded-full bg-muted-foreground/30" />
        </div>

        <nav className="space-y-1 px-2 pb-4">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onOpenChange(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-4 text-sm transition-colors",
                isActive(item.href)
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium tabular-nums text-amber-500">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}

          <div className="my-2 border-t border-border/50" />

          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              signOut({
                fetchOptions: {
                  onSuccess: () => {
                    window.location.href = "/login";
                  },
                },
              });
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-4 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Deconnexion</span>
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
