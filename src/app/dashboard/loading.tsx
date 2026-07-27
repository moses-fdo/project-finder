export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skeleton Navbar */}
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-7 w-28 bg-secondary/80 rounded-lg animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-secondary/80 animate-pulse" />
          <div className="h-8 w-8 rounded-full bg-secondary/80 animate-pulse" />
        </div>
      </header>

      {/* Skeleton Dashboard Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Skeleton */}
        <div className="hidden lg:block space-y-4">
          <div className="card p-4 space-y-3">
            <div className="h-4 w-24 bg-secondary/80 rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-8 w-full bg-secondary/60 rounded-lg animate-pulse" />
              <div className="h-8 w-full bg-secondary/60 rounded-lg animate-pulse" />
              <div className="h-8 w-full bg-secondary/60 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="lg:col-span-3 space-y-6">
          <div className="card p-6 space-y-4">
            <div className="h-6 w-48 bg-secondary/80 rounded animate-pulse" />
            <div className="h-4 w-72 bg-secondary/60 rounded animate-pulse" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 6].map((i) => (
              <div key={i} className="card p-5 space-y-3 border border-border">
                <div className="h-4 w-3/4 bg-secondary/80 rounded animate-pulse" />
                <div className="h-12 w-full bg-secondary/50 rounded animate-pulse" />
                <div className="flex items-center justify-between pt-2">
                  <div className="h-3 w-16 bg-secondary/60 rounded animate-pulse" />
                  <div className="h-3 w-12 bg-secondary/60 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
