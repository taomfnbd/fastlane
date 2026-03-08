"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EventsFilterProps {
  counts: { active: number; draft: number; completed: number; all: number };
}

export function EventsFilter({ counts }: EventsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") ?? "all";

  function updateStatus(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    const qs = params.toString();
    router.push(qs ? `/admin/events?${qs}` : "/admin/events");
  }

  return (
    <Tabs value={currentStatus} onValueChange={updateStatus}>
      <TabsList>
        <TabsTrigger value="all">Tous ({counts.all})</TabsTrigger>
        <TabsTrigger value="active">Actifs ({counts.active})</TabsTrigger>
        <TabsTrigger value="draft">Brouillons ({counts.draft})</TabsTrigger>
        <TabsTrigger value="completed">Termines ({counts.completed})</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
