"use client";

import { Send, RotateCcw } from "lucide-react";
import { InlineActions } from "@/components/admin/inline-actions";
import { submitStrategyForReview, resubmitStrategy } from "@/server/actions/strategy";

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
