"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Search, ChevronRight, Menu, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { resolveEntityNames } from "@/server/actions/search";

interface AppHeaderProps {
  user: { name: string; email: string };
  notificationSlot?: React.ReactNode;
  themeToggleSlot?: React.ReactNode;
  onMobileMenuToggle?: () => void;
  onSignOut?: () => void;
}

const labelMap: Record<string, string> = {
  admin: "Admin",
  portal: "Portail",
  dashboard: "Accueil",
  events: "Evenements",
  companies: "Entreprises",
  deliverables: "Livrables",
  users: "Utilisateurs",
  settings: "Parametres",
  strategy: "Strategie",
  strategies: "Strategies",
  timeline: "Activite",
  activity: "Activite",
};

export function AppHeader({ user, notificationSlot, themeToggleSlot, onMobileMenuToggle, onSignOut }: AppHeaderProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const [entityNames, setEntityNames] = useState<Record<string, string>>({});

  // Detect cuid-like segments (25 chars starting with c)
  const idSegments = segments.filter((s) => /^c[a-z0-9]{24}$/.test(s));

  useEffect(() => {
    if (idSegments.length === 0) {
      setEntityNames({});
      return;
    }
    resolveEntityNames(idSegments).then(setEntityNames);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  function openSearch() {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
  }

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
          const label = entityNames[segment] ?? labelMap[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
          return (
            <span key={segment + i} className="flex items-center gap-1 min-w-0">
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />}
              <span
                className={cn(
                  "truncate max-w-32",
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
          title="Rechercher (Cmd+K)"
          onClick={openSearch}
        >
          <Search className="h-3.5 w-3.5" />
        </Button>

        {themeToggleSlot}

        {notificationSlot}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium hover:ring-2 hover:ring-accent transition-all cursor-pointer">
              {user.name.charAt(0).toUpperCase()}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-xs font-medium">{user.name}</p>
              <p className="text-[11px] text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/settings"><Settings className="h-3.5 w-3.5 mr-2" />Parametres</Link>
            </DropdownMenuItem>
            {onSignOut && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="h-3.5 w-3.5 mr-2" />Deconnexion
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
