"use client";

import { Trash2 } from "lucide-react";
import { InlineActions } from "@/components/admin/inline-actions";
import { deleteEvent } from "@/server/actions/events";
import { useRouter } from "next/navigation";

interface EventDeleteButtonProps {
  eventId: string;
  hasActiveItems: boolean;
}

export function EventDeleteButton({ eventId, hasActiveItems }: EventDeleteButtonProps) {
  const router = useRouter();

  if (hasActiveItems) return null;

  return (
    <InlineActions
      actions={[
        {
          label: "Supprimer",
          icon: <Trash2 className="h-3.5 w-3.5" />,
          action: async () => {
            const result = await deleteEvent(eventId);
            if (result.success) router.push("/admin/events");
            return result;
          },
          confirm: "Supprimer cet evenement ? Cette action est irreversible.",
          variant: "destructive",
        },
      ]}
    />
  );
}
