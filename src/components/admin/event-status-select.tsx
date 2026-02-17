"use client";

import { useState } from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const statuses = [
  { value: "DRAFT", label: "Brouillon" },
  { value: "PREPARATION", label: "Preparation" },
  { value: "ACTIVE", label: "Actif" },
  { value: "REVIEW", label: "Revision" },
  { value: "COMPLETED", label: "Termine" },
  { value: "ARCHIVED", label: "Archive" },
];

interface EventStatusSelectProps {
  eventId: string;
  currentStatus: string;
}

export function EventStatusSelect({ eventId, currentStatus }: EventStatusSelectProps) {
  const [loading, setLoading] = useState(false);

  async function handleChange(newStatus: string) {
    setLoading(true);
    const res = await fetch(`/api/admin/events/${eventId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      toast.success("Statut mis a jour");
    } else {
      toast.error("Echec de la mise a jour");
    }
    setLoading(false);
  }

  return (
    <Select defaultValue={currentStatus} onValueChange={handleChange} disabled={loading}>
      <SelectTrigger className="w-[160px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statuses.map((s) => (
          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
