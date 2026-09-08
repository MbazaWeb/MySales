import { ShimmerCSS } from "../components/Skeleton";

export default function ReportsLoading() {
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

          {/* Reports content skeleton */}
          <div className="p-6">
            {/* Period selector skeleton */}
            <div className="dv-card mb-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-10 w-20 rounded shimmer" style={{ background: "var(--border)" }} />
                  ))}
                </div>
                <div className="h-6 w-32 rounded shimmer" style={{ background: "var(--border)" }} />
              </div>
            </div>

            {/* Summary cards skeleton */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5 mb-6">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="rounded-xl px-4 py-4 shimmer" style={{ background: "var(--border)", height: 100 }} />
              ))}
            </div>

            {/* Detail grid skeleton */}
            <div className="grid gap-6 xl:grid-cols-[1.4fr_.6fr] mb-6">
              {/* Sales breakdown skeleton */}
              <div className="dv-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="h-5 w-32 rounded shimmer" style={{ background: "var(--border)" }} />
                    <div className="mt-1 h-3 w-40 rounded shimmer" style={{ background: "var(--border)" }} />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 rounded shimmer" style={{ background: "var(--border)" }} />
                    <div className="h-8 w-8 rounded shimmer" style={{ background: "var(--border)" }} />
                  </div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex gap-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                      <div className="flex-1">
                        <div className="h-4 w-32 rounded shimmer" style={{ background: "var(--border)" }} />
                        <div className="mt-1 h-3 w-24 rounded shimmer" style={{ background: "var(--border)" }} />
                      </div>
                      <div className="h-4 w-20 rounded shimmer" style={{ background: "var(--border)" }} />
                      <div className="h-4 w-20 rounded shimmer" style={{ background: "var(--border)" }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Stock panel skeleton */}
              <div className="dv-card">
                <div className="h-5 w-32 rounded shimmer mb-1" style={{ background: "var(--border)" }} />
                <div className="h-3 w-40 rounded shimmer mb-4" style={{ background: "var(--border)" }} />
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <div>
                        <div className="h-4 w-24 rounded shimmer" style={{ background: "var(--border)" }} />
                        <div className="mt-1 h-3 w-16 rounded shimmer" style={{ background: "var(--border)" }} />
                      </div>
                      <div className="h-5 w-12 rounded shimmer" style={{ background: "var(--border)" }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stock movement log skeleton */}
            <div className="dv-card p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded shimmer" style={{ background: "var(--border)" }} />
                  <div>
                    <div className="h-5 w-32 rounded shimmer" style={{ background: "var(--border)" }} />
                    <div className="mt-1 h-3 w-40 rounded shimmer" style={{ background: "var(--border)" }} />
                  </div>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-7 w-16 rounded shimmer" style={{ background: "var(--border)" }} />
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex gap-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                    {[1, 2, 3, 4, 5, 6].map(j => (
                      <div key={j} className="h-4 w-16 rounded shimmer" style={{ background: "var(--border)" }} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}