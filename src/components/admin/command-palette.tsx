"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Calendar, Building2, Target, Package, Users, Search, Loader2 } from "lucide-react";
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
              placeholder="Rechercher..."
              className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-1">
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
        </Command>
      </div>
    </div>
  );
}
