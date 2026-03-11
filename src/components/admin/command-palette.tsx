"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Calendar, Building2, Target, Package, Users, Search,
  Loader2, Plus, UserPlus, Zap,
} from "lucide-react";
import { globalSearch } from "@/server/actions/search";

const typeIcons: Record<string, typeof Calendar> = {
  event: Calendar,
  company: Building2,
  strategy: Target,
  deliverable: Package,
  user: Users,
};

const typeLabels: Record<string, string> = {
  event: "Evenements",
  company: "Entreprises",
  strategy: "Strategies",
  deliverable: "Livrables",
  user: "Utilisateurs",
};

const quickActions = [
  {
    id: "create-event",
    title: "Creer un evenement",
    icon: Calendar,
    href: "/admin/events?action=create",
  },
  {
    id: "create-company",
    title: "Creer une entreprise",
    icon: Building2,
    href: "/admin/companies?action=create",
  },
  {
    id: "invite-user",
    title: "Inviter un utilisateur",
    icon: UserPlus,
    href: "/admin/users?action=invite",
  },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Awaited<ReturnType<typeof globalSearch>>>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      startTransition(async () => {
        const data = await globalSearch(query);
        setResults(data);
      });
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  function handleSelect(href: string) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(href);
  }

  if (!open) return null;

  // Group results by type
  const grouped = results.reduce<Record<string, typeof results>>((acc, r) => {
    (acc[r.type] ??= []).push(r);
    return acc;
  }, {});

  const showQuickActions = query.length < 2;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="fixed inset-0 bg-black/50" onClick={() => { setOpen(false); setQuery(""); setResults([]); }} />
      <div className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-lg">
        <Command className="rounded-lg border bg-popover shadow-lg" shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Rechercher ou executer une action..."
              className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-1">
            {showQuickActions && (
              <Command.Group
                heading="Actions rapides"
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {quickActions.map((action) => (
                  <Command.Item
                    key={action.id}
                    value={action.id}
                    onSelect={() => handleSelect(action.href)}
                    className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm cursor-pointer aria-selected:bg-accent"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10">
                      <action.icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span>{action.title}</span>
                    <Plus className="ml-auto h-3 w-3 text-muted-foreground" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {showQuickActions && (
              <Command.Group
                heading="Navigation"
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {[
                  { label: "Dashboard", href: "/admin/dashboard", icon: Zap },
                  { label: "Evenements", href: "/admin/events", icon: Calendar },
                  { label: "Entreprises", href: "/admin/companies", icon: Building2 },
                  { label: "Strategies", href: "/admin/strategies", icon: Target },
                  { label: "Livrables", href: "/admin/deliverables", icon: Package },
                  { label: "Utilisateurs", href: "/admin/users", icon: Users },
                ].map((item) => (
                  <Command.Item
                    key={item.href}
                    value={item.href}
                    onSelect={() => handleSelect(item.href)}
                    className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm cursor-pointer aria-selected:bg-accent"
                  >
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>{item.label}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {query.length >= 2 && results.length === 0 && !isPending && (
              <Command.Empty className="py-6 text-center text-xs text-muted-foreground">
                Aucun resultat.
              </Command.Empty>
            )}
            {Object.entries(grouped).map(([type, items]) => {
              const Icon = typeIcons[type] ?? Search;
              return (
                <Command.Group
                  key={type}
                  heading={typeLabels[type]}
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
                >
                  {items.map((item) => (
                    <Command.Item
                      key={item.id}
                      value={item.id}
                      onSelect={() => handleSelect(item.href)}
                      className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm cursor-pointer aria-selected:bg-accent"
                    >
                      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{item.title}</p>
                        {item.subtitle && (
                          <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                        )}
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              );
            })}
          </Command.List>
          <div className="border-t px-3 py-2 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Tapez pour rechercher</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">ESC</kbd>
          </div>
        </Command>
      </div>
    </div>
  );
}
