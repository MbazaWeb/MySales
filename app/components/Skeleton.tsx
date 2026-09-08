"use client";

/** Base shimmer block */
export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        background: "linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s ease-in-out infinite",
        borderRadius: "0.5rem",
        ...style,
      }}
    />
  );
}

/** Dashboard stat card skeleton */
export function StatCardSkeleton() {
  return (
    <div className="stat-card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Skeleton style={{ height: 12, width: "55%" }} />
        <Skeleton style={{ height: 18, width: 18, borderRadius: "50%" }} />
      </div>
      <Skeleton style={{ height: 32, width: "70%" }} />
      <Skeleton style={{ height: 10, width: "40%" }} />
    </div>
  );
}

/** Table row skeleton */
export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: "0.875rem 1rem" }}>
          <Skeleton style={{ height: 14, width: i === 0 ? "80%" : i % 2 === 0 ? "60%" : "50%" }} />
        </td>
      ))}
    </tr>
  );
}

/** Product table skeleton — 8 rows */
export function InventorySkeleton() {
  return (
    <div className="dv-card overflow-hidden p-0">
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 900 }}>
          <thead>
            <tr style={{ background: "#F8FAFC" }}>
              {["Product", "Category", "Stock", "Unit", "Cost", "Selling", "Profit/unit", "Margin", "Stock value", "Reorder", "Status", "Action"].map(h => (
                <th key={h} style={{ padding: "0.625rem 1rem", textAlign: "left", borderBottom: "1px solid #E2E8F0" }}>
                  <Skeleton style={{ height: 11, width: h.length * 6 }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, i) => (
              <TableRowSkeleton key={i} cols={12} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Sales table skeleton */
export function SalesSkeleton() {
  return (
    <div className="dv-card overflow-hidden p-0">
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={10} />)}
        </tbody>
      </table>
    </div>
  );
}

/** Dashboard full skeleton */
export function DashboardSkeleton() {
  return (
    <div style={{ padding: "1.75rem" }}>
      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", marginBottom: "1.5rem" }}>
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "1.5fr 1fr" }}>
        <div className="dv-card" style={{ minHeight: 280 }}>
          <Skeleton style={{ height: 18, width: "40%", marginBottom: "1.25rem" }} />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.875rem 0", borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ flex: 1 }}>
                <Skeleton style={{ height: 13, width: "60%", marginBottom: 6 }} />
                <Skeleton style={{ height: 10, width: "40%" }} />
              </div>
              <Skeleton style={{ height: 13, width: 80 }} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="dv-card">
            <Skeleton style={{ height: 16, width: "50%", marginBottom: "1rem" }} />
            {[80, 60, 40].map(w => (
              <div key={w} style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <Skeleton style={{ height: 12, width: `${w}%` }} />
                  <Skeleton style={{ height: 12, width: 40 }} />
                </div>
                <Skeleton style={{ height: 6, width: "100%", borderRadius: 999 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

export function ShimmerCSS() {
  return (
    <style>{`
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  );
}
