"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface StrategiesFilterProps {
  events: { id: string; name: string }[];
  companies: { id: string; name: string }[];
  counts: { pending: number; changes: number; all: number };
}

export function StrategiesFilter({ events, companies, counts }: StrategiesFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") ?? "pending";
  const currentEvent = searchParams.get("event") ?? "all";
  const currentCompany = searchParams.get("company") ?? "all";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || (key === "status" && value === "pending")) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/admin/strategies?${params.toString()}`);
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <Tabs value={currentStatus} onValueChange={(v) => updateParam("status", v)}>
        <TabsList>
          <TabsTrigger value="pending">En attente ({counts.pending})</TabsTrigger>
          <TabsTrigger value="changes">Modif. demandees ({counts.changes})</TabsTrigger>
          <TabsTrigger value="all">Tout ({counts.all})</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex items-center gap-2 ml-auto">
        <Select value={currentEvent} onValueChange={(v) => updateParam("event", v)}>
          <SelectTrigger size="sm" className="text-xs">
            <SelectValue placeholder="Evenement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les evenements</SelectItem>
            {events.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={currentCompany} onValueChange={(v) => updateParam("company", v)}>
          <SelectTrigger size="sm" className="text-xs">
            <SelectValue placeholder="Entreprise" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les entreprises</SelectItem>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
