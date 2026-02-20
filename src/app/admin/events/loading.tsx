export default function EventsLoading() {
  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-36 rounded bg-muted animate-pulse" />
        <div className="h-9 w-32 rounded-md bg-muted animate-pulse" />
      </div>

      {/* Event cards */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-lg border p-4"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-44 rounded bg-muted animate-pulse" />
                <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
              </div>
              <div className="h-3 w-56 rounded bg-muted animate-pulse" />
              <div className="flex items-center gap-2 max-w-xs">
                <div className="h-2 flex-1 rounded-full bg-muted animate-pulse" />
                <div className="h-3 w-8 rounded bg-muted animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
