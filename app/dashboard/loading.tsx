import { ShimmerCSS } from "../components/Skeleton";

export default function DashboardLoading() {
  return (
    <>
      <ShimmerCSS />
      <div className="min-h-screen" style={{ background: "var(--background)" }}>
        <div className="lg:ml-60">
          {/* Header skeleton */}
          <div 
            className="flex items-center justify-between px-6"
            style={{ 
              height: 64, 
              background: "rgba(247,248,250,0.92)", 
              borderBottom: "1px solid #E2E8F0" 
            }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="h-6 w-32 rounded shimmer"
                style={{ background: "var(--border)" }}
              />
              <div 
                className="h-4 w-48 rounded shimmer"
                style={{ background: "var(--border)" }}
              />
            </div>
            <div className="flex items-center gap-3">
              <div 
                className="h-8 w-8 rounded-full shimmer"
                style={{ background: "var(--border)" }}
              />
              <div 
                className="h-8 w-8 rounded-full shimmer"
                style={{ background: "var(--border)" }}
              />
            </div>
          </div>

          {/* Dashboard content skeleton */}
          <div className="p-6">
            {/* Low stock banner skeleton */}
            <div className="mb-6 h-16 rounded-lg shimmer" style={{ background: "var(--border)" }} />

            {/* Stat cards skeleton */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="stat-card" style={{ padding: "1.125rem 1.25rem" }}>
                  <div className="flex items-start justify-between">
                    <div className="h-4 w-20 rounded shimmer" style={{ background: "var(--border)" }} />
                    <div className="h-5 w-5 rounded shimmer" style={{ background: "var(--border)" }} />
                  </div>
                  <div className="mt-4 h-8 w-24 rounded shimmer" style={{ background: "var(--border)" }} />
                  <div className="mt-1 h-3 w-16 rounded shimmer" style={{ background: "var(--border)" }} />
                </div>
              ))}
            </div>

            {/* Graphs section skeleton */}
            <div className="grid gap-6 lg:grid-cols-2 mb-6">
              {/* Sales trend skeleton */}
              <div className="dv-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="h-5 w-32 rounded shimmer" style={{ background: "var(--border)" }} />
                    <div className="mt-1 h-3 w-40 rounded shimmer" style={{ background: "var(--border)" }} />
                  </div>
                  <div className="h-5 w-5 rounded shimmer" style={{ background: "var(--border)" }} />
                </div>
                <div className="flex items-end justify-between gap-1 h-32">
                  {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-sm shimmer" style={{ 
                        height: `${20 + Math.random() * 60}%`, 
                        background: "var(--border)" 
                      }} />
                      <div className="h-3 w-6 rounded shimmer" style={{ background: "var(--border)" }} />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                  {[1, 2, 3].map(i => (
                    <div key={i}>
                      <div className="h-3 w-12 rounded shimmer" style={{ background: "var(--border)" }} />
                      <div className="mt-1 h-4 w-20 rounded shimmer" style={{ background: "var(--border)" }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Stock by category skeleton */}
              <div className="dv-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="h-5 w-32 rounded shimmer" style={{ background: "var(--border)" }} />
                    <div className="mt-1 h-3 w-24 rounded shimmer" style={{ background: "var(--border)" }} />
                  </div>
                  <div className="h-5 w-5 rounded shimmer" style={{ background: "var(--border)" }} />
                </div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <div className="h-4 w-24 rounded shimmer" style={{ background: "var(--border)" }} />
                        <div className="h-4 w-12 rounded shimmer" style={{ background: "var(--border)" }} />
                      </div>
                      <div className="h-2 rounded-full shimmer" style={{ background: "var(--border)" }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent sales and right column skeleton */}
            <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              {/* Recent sales skeleton */}
              <div className="dv-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="h-5 w-32 rounded shimmer" style={{ background: "var(--border)" }} />
                    <div className="mt-1 h-3 w-40 rounded shimmer" style={{ background: "var(--border)" }} />
                  </div>
                  <div className="h-4 w-20 rounded shimmer" style={{ background: "var(--border)" }} />
                </div>
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center justify-between gap-3 py-3.5">
                      <div>
                        <div className="h-4 w-32 rounded shimmer" style={{ background: "var(--border)" }} />
                        <div className="mt-1 h-3 w-24 rounded shimmer" style={{ background: "var(--border)" }} />
                      </div>
                      <div className="text-right">
                        <div className="h-4 w-20 rounded shimmer" style={{ background: "var(--border)" }} />
                        <div className="mt-1 h-3 w-16 rounded shimmer" style={{ background: "var(--border)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right column skeleton */}
              <div className="space-y-5">
                {/* Top sellers skeleton */}
                <div className="dv-card">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-4 w-4 rounded shimmer" style={{ background: "var(--border)" }} />
                    <div className="h-5 w-24 rounded shimmer" style={{ background: "var(--border)" }} />
                  </div>
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i}>
                        <div className="flex justify-between mb-1.5">
                          <div className="h-4 w-20 rounded shimmer" style={{ background: "var(--border)" }} />
                          <div className="h-4 w-12 rounded shimmer" style={{ background: "var(--border)" }} />
                        </div>
                        <div className="h-1.5 rounded-full shimmer" style={{ background: "var(--border)" }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stock attention skeleton */}
                <div className="dv-card">
                  <div className="h-5 w-32 rounded shimmer mb-3" style={{ background: "var(--border)" }} />
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex justify-between rounded-lg px-3 py-2.5" style={{ background: "var(--warning-bg)" }}>
                        <div className="h-4 w-24 rounded shimmer" style={{ background: "var(--border)" }} />
                        <div className="h-4 w-12 rounded shimmer" style={{ background: "var(--border)" }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}