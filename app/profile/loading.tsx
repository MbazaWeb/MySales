import { ShimmerCSS } from "../components/Skeleton";

export default function ProfileLoading() {
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

          {/* Profile content skeleton */}
          <div className="p-6">
            {/* Owner hero skeleton */}
            <div className="rounded-xl p-5 sm:p-6 mb-6 shimmer" style={{ background: "var(--border)", height: 120 }} />

            <div className="grid gap-6 xl:grid-cols-[1.4fr_.6fr]">
              {/* Branches section skeleton */}
              <div className="space-y-6">
                <div className="dv-card">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div className="h-5 w-40 rounded shimmer" style={{ background: "var(--border)" }} />
                      <div className="mt-1 h-3 w-32 rounded shimmer" style={{ background: "var(--border)" }} />
                    </div>
                    <div className="h-9 w-28 rounded shimmer" style={{ background: "var(--border)" }} />
                  </div>
                  <div className="space-y-4">
                    {[1, 2].map(i => (
                      <div key={i} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                        <div className="flex items-center gap-3 px-4 py-3 shimmer" style={{ background: "var(--border)", height: 56 }} />
                        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                          {[1, 2].map(j => (
                            <div key={j} className="flex items-center justify-between px-4 py-3 gap-3">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full shimmer" style={{ background: "var(--border)" }} />
                                <div>
                                  <div className="h-4 w-24 rounded shimmer" style={{ background: "var(--border)" }} />
                                  <div className="mt-1 h-3 w-16 rounded shimmer" style={{ background: "var(--border)" }} />
                                </div>
                              </div>
                              <div className="h-5 w-16 rounded shimmer" style={{ background: "var(--border)" }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Owner access skeleton */}
                <div className="dv-card">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-4 w-4 rounded shimmer" style={{ background: "var(--border)" }} />
                    <div className="h-5 w-24 rounded shimmer" style={{ background: "var(--border)" }} />
                  </div>
                  <div className="flex items-center gap-3 rounded-lg px-3 py-3" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                    <div className="h-9 w-9 rounded-full shimmer" style={{ background: "var(--border)" }} />
                    <div className="flex-1">
                      <div className="h-4 w-32 rounded shimmer" style={{ background: "var(--border)" }} />
                      <div className="mt-1 h-3 w-48 rounded shimmer" style={{ background: "var(--border)" }} />
                    </div>
                    <div className="h-6 w-24 rounded-full shimmer" style={{ background: "var(--border)" }} />
                  </div>
                </div>
              </div>

              {/* Right column skeleton */}
              <div className="space-y-6">
                {/* Alerts skeleton */}
                <div className="dv-card">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-4 w-4 rounded shimmer" style={{ background: "var(--border)" }} />
                    <div className="h-5 w-32 rounded shimmer" style={{ background: "var(--border)" }} />
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-3" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                        <div className="h-4 w-4 rounded shimmer" style={{ background: "var(--border)" }} />
                        <div className="flex-1">
                          <div className="h-4 w-24 rounded shimmer" style={{ background: "var(--border)" }} />
                          <div className="mt-1 h-3 w-32 rounded shimmer" style={{ background: "var(--border)" }} />
                        </div>
                        <div className="h-5 w-9 rounded-full shimmer" style={{ background: "var(--border)" }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subscription plans skeleton */}
                <div className="dv-card">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-4 w-4 rounded shimmer" style={{ background: "var(--border)" }} />
                    <div className="h-5 w-40 rounded shimmer" style={{ background: "var(--border)" }} />
                  </div>
                  <div className="h-3 w-48 rounded shimmer mb-4" style={{ background: "var(--border)" }} />
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="rounded-xl p-3.5 shimmer" style={{ background: "var(--border)", height: 80 }} />
                    ))}
                  </div>
                  <div className="h-10 w-full rounded shimmer" style={{ background: "var(--border)" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}