export default function CompaniesLoading() {
  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-5 w-28 rounded bg-muted animate-pulse" />
        <div className="h-8 w-28 rounded-md bg-muted animate-pulse" />
      </div>

      {/* Company rows */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-2.5 rounded-md px-2 py-2"
        >
          <div className="h-7 w-7 shrink-0 rounded-full bg-muted animate-pulse" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3.5 w-36 rounded bg-muted animate-pulse" />
            <div className="h-2.5 w-28 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}
