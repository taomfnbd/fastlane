"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface ActivityFilterProps {
  users: { id: string; name: string }[];
  events: { id: string; name: string }[];
}

const activityTypes = [
  { value: "all", label: "Tous les types" },
  { value: "STRATEGY_CREATED", label: "Strategie creee" },
  { value: "STRATEGY_SUBMITTED", label: "Strategie soumise" },
  { value: "STRATEGY_APPROVED", label: "Strategie approuvee" },
  { value: "STRATEGY_REJECTED", label: "Strategie refusee" },
  { value: "DELIVERABLE_CREATED", label: "Livrable cree" },
  { value: "DELIVERABLE_SUBMITTED", label: "Livrable soumis" },
  { value: "DELIVERABLE_APPROVED", label: "Livrable approuve" },
  { value: "DELIVERABLE_REJECTED", label: "Livrable refuse" },
  { value: "COMMENT_ADDED", label: "Commentaire" },
  { value: "STATUS_CHANGED", label: "Statut modifie" },
  { value: "FILE_UPLOADED", label: "Fichier uploade" },
];

export function ActivityFilter({ users, events }: ActivityFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `/admin/activity?${qs}` : "/admin/activity");
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={searchParams.get("type") ?? "all"} onValueChange={(v) => updateParam("type", v)}>
        <SelectTrigger size="sm" className="text-xs w-44">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          {activityTypes.map((t) => (
            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={searchParams.get("user") ?? "all"} onValueChange={(v) => updateParam("user", v)}>
        <SelectTrigger size="sm" className="text-xs w-40">
          <SelectValue placeholder="Utilisateur" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous</SelectItem>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={searchParams.get("event") ?? "all"} onValueChange={(v) => updateParam("event", v)}>
        <SelectTrigger size="sm" className="text-xs w-40">
          <SelectValue placeholder="Evenement" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous</SelectItem>
          {events.map((e) => (
            <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
