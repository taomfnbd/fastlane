"use client";

import { Send, RotateCcw, Truck } from "lucide-react";
import { InlineActions } from "@/components/admin/inline-actions";
import { submitDeliverableForReview, resubmitDeliverable, markDeliverableDelivered } from "@/server/actions/deliverables";

interface DeliverableListActionsProps {
  deliverableId: string;
  status: string;
}

export function DeliverableListActions({ deliverableId, status }: DeliverableListActionsProps) {
  const actions = [];

  if (status === "DRAFT") {
    actions.push({
      label: "Soumettre",
      icon: <Send className="h-3.5 w-3.5" />,
      action: () => submitDeliverableForReview(deliverableId),
      confirm: "Soumettre ce livrable pour validation client ?",
    });
  }

  if (status === "CHANGES_REQUESTED") {
    actions.push({
      label: "Resoumettre",
      icon: <RotateCcw className="h-3.5 w-3.5" />,
      action: () => resubmitDeliverable(deliverableId),
      confirm: "Resoumettre ce livrable revise ?",
    });
  }

  if (status === "APPROVED") {
    actions.push({
      label: "Marquer livre",
      icon: <Truck className="h-3.5 w-3.5" />,
      action: () => markDeliverableDelivered(deliverableId),
      confirm: "Marquer ce livrable comme livre ?",
    });
  }

  return <InlineActions actions={actions} />;
}
