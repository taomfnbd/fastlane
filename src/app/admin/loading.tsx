export default function AdminLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="h-7 w-40 rounded bg-muted animate-pulse" />

      {/* Content area */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-2">
            <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
            <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
