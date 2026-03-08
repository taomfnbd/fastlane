"use client";

import { Send, RotateCcw, Trash2 } from "lucide-react";
import { InlineActions } from "@/components/admin/inline-actions";
import { submitStrategyForReview, resubmitStrategy, deleteStrategy } from "@/server/actions/strategy";

interface StrategyListActionsProps {
  strategyId: string;
  status: string;
}

export function StrategyListActions({ strategyId, status }: StrategyListActionsProps) {
  const actions = [];

  if (status === "DRAFT") {
    actions.push({
      label: "Soumettre",
      icon: <Send className="h-3.5 w-3.5" />,
      action: () => submitStrategyForReview(strategyId),
      confirm: "Soumettre cette strategie pour validation client ?",
    });
    actions.push({
      label: "Supprimer",
      icon: <Trash2 className="h-3.5 w-3.5" />,
      action: () => deleteStrategy(strategyId),
      confirm: "Supprimer cette strategie ? Cette action est irreversible.",
      variant: "destructive" as const,
    });
  }

  if (status === "CHANGES_REQUESTED") {
    actions.push({
      label: "Resoumettre",
      icon: <RotateCcw className="h-3.5 w-3.5" />,
      action: () => resubmitStrategy(strategyId),
      confirm: "Resoumettre cette strategie revisee ?",
    });
  }

  return <InlineActions actions={actions} />;
}
