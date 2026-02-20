export default function DeliverablesLoading() {
  return (
    <div className="space-y-6">
      <div className="h-7 w-32 rounded bg-muted animate-pulse" />
      <div className="rounded-md border divide-y">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-48 rounded bg-muted animate-pulse" />
              <div className="h-2.5 w-32 rounded bg-muted animate-pulse" />
            </div>
            <div className="h-5 w-20 rounded-full bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
