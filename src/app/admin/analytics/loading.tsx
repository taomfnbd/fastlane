import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-3 w-64 mt-1.5" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-4 space-y-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border p-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </div>
        <div className="rounded-xl border p-6">
          <Skeleton className="h-4 w-40 mb-4" />
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border p-6">
          <Skeleton className="h-4 w-36 mb-4" />
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </div>
        <div className="rounded-xl border p-6">
          <Skeleton className="h-4 w-28 mb-4" />
          <div className="space-y-3 mt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
