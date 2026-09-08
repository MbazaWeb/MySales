"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, FileBarChart,
  Shield, LogOut, Gem,
} from "lucide-react";
import { useTransition } from "react";
import { signOut } from "@/lib/supabase/client-actions";

const links = [
  { href: "/admin",         label: "Overview",   icon: LayoutDashboard, exact: true },
  { href: "/admin/users",   label: "Users",      icon: Users },
  { href: "/admin/reports", label: "Reports",    icon: FileBarChart },
];

export default function AdminShell({
  children, adminEmail,
}: {
  children: React.ReactNode;
  adminEmail: string;
}) {
  const path = usePathname();
  const [pending, start] = useTransition();

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "#0A1628", color: "#E2E8F0" }}>

      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        display: "flex", flexDirection: "column",
        background: "#060E1A",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        position: "sticky", top: 0, height: "100dvh",
      }}>
        {/* Brand */}
        <div style={{ padding: "1.25rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--gold-500)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Gem size={16} color="#0F1B2D" />
          </div>
          <div>
            <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#fff", lineHeight: 1 }}>DukaVerse</p>
            <p style={{ fontSize: "10px", color: "#C9A84C", marginTop: 2, fontWeight: 600 }}>Admin Console</p>
          </div>
        </div>

        {/* Admin badge */}
        <div style={{ margin: "0.75rem", padding: "0.5rem 0.75rem", borderRadius: 8, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Shield size={13} color="#C9A84C" />
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#C9A84C" }}>Super Admin</span>
          </div>
          <p style={{ fontSize: "10px", color: "#4E6A8A", marginTop: 2, wordBreak: "break-all" }}>{adminEmail}</p>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0.75rem", display: "flex", flexDirection: "column", gap: 2 }}>
          {links.map(l => {
            const I = l.icon;
            const active = l.exact ? path === l.href : path.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} style={{
                display: "flex", alignItems: "center", gap: "0.625rem",
                padding: "0.55rem 0.75rem", borderRadius: 7,
                fontSize: "0.875rem", fontWeight: 500,
                color: active ? "#0F1B2D" : "#64748B",
                background: active ? "#C9A84C" : "transparent",
                textDecoration: "none",
                transition: "all 120ms",
              }}>
                <I size={16} />
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Back to app + sign out */}
        <div style={{ padding: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          <Link href="/dashboard" style={{
            display: "flex", alignItems: "center", gap: "0.625rem",
            padding: "0.5rem 0.75rem", borderRadius: 7,
            fontSize: "0.8125rem", color: "#4E6A8A", textDecoration: "none",
          }}>
            ← Back to app
          </Link>
          <button
            onClick={() => start(async () => { await signOut(); })}
            disabled={pending}
            style={{
              display: "flex", alignItems: "center", gap: "0.625rem",
              padding: "0.5rem 0.75rem", borderRadius: 7,
              fontSize: "0.8125rem", color: "#4E6A8A",
              background: "transparent", border: "none", cursor: "pointer",
            }}
          >
            <LogOut size={14} />
            {pending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowX: "hidden" }}>
        {children}
      </main>
    </div>
  );
}