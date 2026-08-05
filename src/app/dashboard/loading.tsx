export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop Sidebar Skeleton */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border bg-card shrink-0 h-screen sticky top-0">
        <div className="h-14 border-b border-border px-4 flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-secondary/80 animate-pulse" />
          <div className="h-4 w-24 bg-secondary/80 rounded animate-pulse" />
        </div>
        <nav className="flex-1 px-2.5 py-3 space-y-5">
          <div className="space-y-px">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-9 w-full bg-secondary/50 rounded-lg animate-pulse" />
            ))}
          </div>
          <div>
            <div className="h-3 w-20 bg-secondary/50 rounded mb-2 mx-3 animate-pulse" />
            <div className="space-y-px">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 w-full bg-secondary/50 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </nav>
        <div className="p-3 border-t border-border">
          <div className="h-11 w-full bg-secondary/50 rounded-lg animate-pulse" />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop header skeleton */}
        <header className="hidden md:flex h-14 border-b border-border items-center justify-between px-6 bg-card/95 sticky top-0 z-40">
          <div className="h-9 w-64 bg-secondary/50 rounded-lg animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-secondary/50 animate-pulse" />
            <div className="h-8 w-20 bg-secondary/50 rounded-lg animate-pulse" />
          </div>
        </header>

        {/* Mobile header skeleton */}
        <header className="flex md:hidden h-14 border-b border-border items-center justify-between px-4 bg-card sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-secondary/80 animate-pulse" />
            <div className="h-4 w-20 bg-secondary/80 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-1">
            <div className="h-11 w-11 rounded-xl bg-secondary/50 animate-pulse" />
            <div className="h-11 w-11 rounded-xl bg-secondary/50 animate-pulse" />
          </div>
        </header>

        {/* Content skeleton */}
        <div className="flex-1 mobile-scroll-pad p-4 sm:p-5 md:p-7 space-y-6">
          <div className="space-y-3">
            <div className="h-6 w-48 bg-secondary/70 rounded animate-pulse" />
            <div className="h-4 w-72 bg-secondary/50 rounded animate-pulse" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-4 space-y-3">
                <div className="h-3 w-16 bg-secondary/60 rounded animate-pulse" />
                <div className="h-8 w-12 bg-secondary/70 rounded animate-pulse" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card p-5 space-y-3 border border-border">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-16 bg-secondary/70 rounded animate-pulse" />
                  <div className="h-3 w-14 bg-secondary/50 rounded animate-pulse" />
                </div>
                <div className="h-4 w-3/4 bg-secondary/70 rounded animate-pulse" />
                <div className="h-3 w-full bg-secondary/50 rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-secondary/50 rounded animate-pulse" />
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-secondary/60 animate-pulse" />
                    <div className="h-3 w-16 bg-secondary/60 rounded animate-pulse" />
                  </div>
                  <div className="h-7 w-20 bg-secondary/60 rounded-md animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav skeleton */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 z-50 md:hidden">
        <div className="flex items-center justify-around h-16">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="h-5 w-5 rounded-full bg-secondary/60 animate-pulse" />
              <div className="h-2 w-10 bg-secondary/50 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}
