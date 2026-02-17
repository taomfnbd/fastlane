"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateEvent } from "@/server/actions/events";

const statuses = [
  { value: "DRAFT", label: "Draft" },
  { value: "PREPARATION", label: "Preparation" },
  { value: "ACTIVE", label: "Active" },
  { value: "REVIEW", label: "Review" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
];

interface EventStatusSelectProps {
  eventId: string;
  currentStatus: string;
}

export function EventStatusSelect({ eventId, currentStatus }: EventStatusSelectProps) {
  const [loading, setLoading] = useState(false);

  async function handleChange(newStatus: string) {
    setLoading(true);

    // We need to pass the full form data. To avoid extra fetching,
    // we just update the status via a simple server action call.
    const formData = new FormData();
    formData.set("id", eventId);
    formData.set("status", newStatus);

    // We also need name/dates but those are required by the schema.
    // Use a direct prisma call instead via a dedicated action.
    const res = await fetch(`/api/admin/events/${eventId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      toast.success("Status updated");
    } else {
      toast.error("Failed to update status");
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
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
