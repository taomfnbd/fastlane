"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavTab {
  label: string;
  href: string;
  badge?: number;
}

interface PortalTopnavProps {
  user: { name: string; email: string };
  companyName: string;
  pendingStrategies: number;
  pendingDeliverables: number;
  notificationSlot: React.ReactNode;
  onMobileMenuOpen: () => void;
}

export function PortalTopnav({
  user,
  companyName,
  pendingStrategies,
  pendingDeliverables,
  notificationSlot,
  onMobileMenuOpen,
}: PortalTopnavProps) {
  const pathname = usePathname();

  const tabs: NavTab[] = [
    { label: "Accueil", href: "/portal/dashboard" },
    { label: "Strategies", href: "/portal/strategy", badge: pendingStrategies },
    { label: "Livrables", href: "/portal/deliverables", badge: pendingDeliverables },
  ];

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const initials = companyName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-4xl items-center px-4 lg:px-6">
        {/* Mobile: hamburger */}
        <button
          type="button"
          className="mr-3 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground lg:hidden"
          onClick={onMobileMenuOpen}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="2" y1="4" x2="14" y2="4" />
            <line x1="2" y1="8" x2="14" y2="8" />
            <line x1="2" y1="12" x2="14" y2="12" />
          </svg>
        </button>

        {/* Logo + Company */}
        <Link href="/portal/dashboard" className="flex items-center gap-2.5 shrink-0">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background text-[11px] font-bold">
            {initials}
          </span>
          <span className="hidden text-sm font-semibold sm:block">{companyName}</span>
        </Link>

        {/* Desktop tabs */}
        <nav className="ml-8 hidden items-center gap-1 lg:flex">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                isActive(tab.href)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.badge ? (
                <span className="inline-flex items-center justify-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium tabular-nums text-amber-500">
                  {tab.badge}
                </span>
              ) : null}
              {/* Active indicator */}
              {isActive(tab.href) && (
                <span className="absolute -bottom-[11px] left-3 right-3 h-0.5 rounded-full bg-foreground" />
              )}
            </Link>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {notificationSlot}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="ml-1 flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium hover:ring-2 hover:ring-ring/20 transition-shadow"
              >
                {user.name.charAt(0).toUpperCase()}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/portal/settings">
                  <Settings className="h-4 w-4" />
                  Parametres
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        window.location.href = "/login";
                      },
                    },
                  })
                }
                variant="destructive"
              >
                <LogOut className="h-4 w-4" />
                Deconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
