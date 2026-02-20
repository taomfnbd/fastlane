import { Skeleton } from "@/components/ui/skeleton";

export function DetailSkeleton() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-md" />
        <Skeleton className="h-20 w-full rounded-md" />
        <Skeleton className="h-20 w-full rounded-md" />
      </div>
    </div>
  );
}
