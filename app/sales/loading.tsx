import { ShimmerCSS } from "../components/Skeleton";

export default function SalesLoading() {
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

          {/* Sales content skeleton */}
          <div className="p-6">
            {/* Header action skeleton */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-3">
                <div className="h-14 w-32 rounded shimmer" style={{ background: "var(--border)" }} />
                <div className="h-14 w-32 rounded shimmer" style={{ background: "var(--border)" }} />
              </div>
              <div className="h-10 w-32 rounded shimmer" style={{ background: "var(--border)" }} />
            </div>

            {/* Search skeleton */}
            <div className="mb-5 h-11 rounded-lg shimmer" style={{ background: "var(--border)" }} />

            {/* Sales table skeleton */}
            <div className="dv-card overflow-hidden p-4">
              <div className="space-y-3">
                {/* Table header */}
                <div className="flex gap-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                    <div key={i} className="h-4 w-12 rounded shimmer" style={{ background: "var(--border)" }} />
                  ))}
                </div>
                {/* Table rows */}
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="flex gap-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(j => (
                      <div key={j} className="h-4 w-10 rounded shimmer" style={{ background: "var(--border)" }} />
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