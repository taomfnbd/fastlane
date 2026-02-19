"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface DeliverablesFilterProps {
  events: { id: string; name: string }[];
  companies: { id: string; name: string }[];
  counts: { review: number; changes: number; all: number };
}

export function DeliverablesFilter({ events, companies, counts }: DeliverablesFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") ?? "review";
  const currentEvent = searchParams.get("event") ?? "all";
  const currentCompany = searchParams.get("company") ?? "all";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || (key === "status" && value === "review")) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/admin/deliverables?${params.toString()}`);
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <Tabs value={currentStatus} onValueChange={(v) => updateParam("status", v)}>
        <TabsList>
          <TabsTrigger value="review">En review ({counts.review})</TabsTrigger>
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
