import { Target } from "lucide-react";

export default function StrategyDetailDefault() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <Target className="h-8 w-8 text-muted-foreground/30" />
      <p className="mt-3 text-sm text-muted-foreground">Selectionnez une strategie</p>
    </div>
  );
}
