import { DashboardSkeleton, ShimmerCSS } from "../components/Skeleton";
export default function Loading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <ShimmerCSS />
      <div className="lg:ml-60">
        <div style={{ height: 64, background: "rgba(247,248,250,0.92)", borderBottom: "1px solid #E2E8F0" }} />
        <DashboardSkeleton />
      </div>
    </div>
  );
}
