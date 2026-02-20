import { cn } from "@/lib/utils";

interface SplitViewLayoutProps {
  list: React.ReactNode;
  detail: React.ReactNode;
  className?: string;
}

export function SplitViewLayout({ list, detail, className }: SplitViewLayoutProps) {
  return (
    <div className={cn("flex h-[calc(100vh-4rem)] gap-0", className)}>
      <div className="w-full lg:w-[340px] lg:min-w-[300px] lg:max-w-[400px] lg:border-r shrink-0">
        <div className="h-full overflow-y-auto">
          {list}
        </div>
      </div>
      <div className="hidden lg:block flex-1 min-w-0">
        <div className="h-full overflow-y-auto">
          {detail}
        </div>
      </div>
    </div>
  );
}
