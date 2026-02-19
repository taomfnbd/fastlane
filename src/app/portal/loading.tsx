export default function PortalLoading() {
  return (
    <div className="space-y-8 animate-fade-up">
      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-6 w-48 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-72 rounded-md bg-muted animate-pulse" />
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-2 gap-4">
        <div className="h-24 rounded-xl bg-muted/50 animate-pulse" />
        <div className="h-24 rounded-xl bg-muted/50 animate-pulse" />
      </div>

      {/* List skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-32 rounded-md bg-muted animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
