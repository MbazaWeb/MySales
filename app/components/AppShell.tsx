"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ReceiptText, Package, FileBarChart, UserRound, Menu, ChevronDown, LogOut } from "lucide-react";
import { useState, useTransition } from "react";
import { signOut } from "@/lib/supabase/actions";

const links = [
  { href: "/dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { href: "/sales",     label: "Sales",      icon: ReceiptText },
  { href: "/inventory", label: "Inventory",  icon: Package },
  { href: "/reports",   label: "Reports",    icon: FileBarChart },
  { href: "/profile",   label: "Profile",    icon: UserRound },
];

interface AppShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  branchId?: string;
  bizName?: string;
  userName?: string;
}

export default function AppShell({ title, subtitle, children, action, bizName, userName }: AppShellProps) {
  const path = usePathname();
  const [open, setOpen]     = useState(false);
  const [pending, start]    = useTransition();

  const initials = (userName ?? "?")
    .split(" ").map(w => w.trim()).filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();

  function handleSignOut() {
    start(async () => { await signOut(); });
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)", color: "var(--text-primary)" }}>

      {/* ── Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 flex flex-col transition-transform duration-200 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "var(--navy-900)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="grid size-9 place-items-center rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
            <img src="/logo.png" alt="" className="size-7 object-contain" />
          </div>
          <div>
            <span className="block font-bold text-white text-base tracking-tight">DukaVerse</span>
            <span className="text-[11px]" style={{ color: "#4E6A8A" }}>Business platform</span>
          </div>
        </div>

        {/* Active branch */}
        {bizName && (
          <div className="mx-4 mt-4 rounded-lg px-3 py-2.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-[10px] font-medium uppercase tracking-widest mb-1" style={{ color: "#4E6A8A" }}>Active business</p>
            <button className="flex w-full items-center justify-between text-left">
              <span className="text-sm font-semibold text-white truncate">{bizName}</span>
              <ChevronDown size={14} style={{ color: "#4E6A8A" }} />
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 p-4 pt-5 overflow-y-auto">
          {links.map(l => {
            const I = l.icon;
            const active = path === l.href;
            return (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                className="nav-item"
                style={active ? { background: "var(--gold-500)", color: "var(--navy-900)" } : {}}>
                <I size={17} />
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* User + sign out */}
        <div className="p-4 space-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          {userName && (
            <div className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div className="grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold"
                style={{ background: "var(--gold-500)", color: "var(--navy-900)" }}>
                {initials}
              </div>
              <span className="text-xs font-medium text-white truncate">{userName}</span>
            </div>
          )}
          <button onClick={handleSignOut} disabled={pending}
            className="nav-item w-full" style={{ color: "#94A3B8" }}>
            <LogOut size={16} />
            {pending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {open && (
        <button aria-label="Close menu" className="fixed inset-0 z-30 lg:hidden"
          style={{ background: "rgba(15,27,45,0.5)" }} onClick={() => setOpen(false)} />
      )}

      {/* ── Main ── */}
      <main className="min-h-screen pb-24 lg:ml-60 lg:pb-8">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between px-4 sm:px-7"
          style={{ background: "rgba(247,248,250,0.92)", backdropFilter: "blur(8px)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <button aria-label="Open menu" className="btn-ghost lg:hidden px-2.5" onClick={() => setOpen(true)}>
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-lg font-semibold">{title}</h1>
              <p className="hidden text-xs sm:block" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">{action}</div>
        </header>

        <div className="mx-auto max-w-7xl p-4 sm:p-7">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid h-16 grid-cols-5 border-t bg-white px-1 lg:hidden"
        style={{ borderColor: "var(--border)" }}>
        {links.map(l => {
          const I = l.icon;
          const active = path === l.href;
          return (
            <Link key={l.href} href={l.href}
              className="flex flex-col items-center justify-center gap-1 text-[10px] font-semibold"
              style={{ color: active ? "var(--gold-500)" : "var(--text-muted)" }}>
              <I size={19} />
              {l.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
