import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-40" />
      <div className="rounded-md border p-6 space-y-4">
        <Skeleton className="h-5 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
    </div>
  );
}
