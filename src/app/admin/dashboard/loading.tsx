export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="h-7 w-48 rounded bg-muted animate-pulse" />

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-background p-4 space-y-3">
            <div className="h-3 w-24 rounded bg-muted animate-pulse" />
            <div className="h-7 w-12 rounded bg-muted animate-pulse" />
            {i >= 2 && (
              <div className="space-y-1">
                <div className="h-2 w-full rounded-full bg-muted animate-pulse" />
                <div className="h-3 w-20 rounded bg-muted animate-pulse" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action items + Questions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="h-4 w-20 rounded bg-muted animate-pulse" />
          <div className="rounded-md border divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <div className="h-2 w-2 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-2.5 w-1/2 rounded bg-muted animate-pulse" />
                </div>
                <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-36 rounded bg-muted animate-pulse" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-md border p-3 space-y-2">
              <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
              <div className="h-3 w-full rounded bg-muted animate-pulse" />
              <div className="h-2.5 w-16 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Event progression */}
      <div className="space-y-3">
        <div className="h-4 w-52 rounded bg-muted animate-pulse" />
        <div className="rounded-md border divide-y">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-40 rounded bg-muted animate-pulse" />
                <div className="h-2.5 w-28 rounded bg-muted animate-pulse" />
              </div>
              <div className="flex items-center gap-3 w-40">
                <div className="h-2 flex-1 rounded-full bg-muted animate-pulse" />
                <div className="h-3 w-8 rounded bg-muted animate-pulse" />
              </div>
              <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
