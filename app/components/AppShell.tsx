"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, ReceiptText, Package,
  FileBarChart, UserRound, Menu, X,
  ChevronDown, LogOut, Gem, Bell, Clock
} from "lucide-react";
import { useState, useTransition, useCallback, memo } from "react";
import { signOut } from "@/lib/supabase/client-actions";

const links = [
  { href: "/dashboard", label: "Dashboard",  icon: LayoutDashboard, shortLabel: "Home"  },
  { href: "/sales",     label: "Sales",      icon: ReceiptText,     shortLabel: "Sales" },
  { href: "/inventory", label: "Inventory",  icon: Package,         shortLabel: "Stock" },
  { href: "/reports",   label: "Reports",    icon: FileBarChart,    shortLabel: "Reports"},
  { href: "/profile",   label: "Profile",    icon: UserRound,       shortLabel: "Me"    },
];

interface AppShellProps {
  title:     string;
  subtitle:  string;
  time?:     string;
  children:  React.ReactNode;
  action?:   React.ReactNode;
  branchId?: string;
  bizName?:  string;
  userName?: string;
}

function AppShell({ title, subtitle, time, children, action, bizName, userName }: AppShellProps) {
  const path              = usePathname();
  const router            = useRouter();
  const [open, setOpen]   = useState(false);
  const [pending, start]  = useTransition();

  const initials = (userName ?? "?")
    .split(" ").map(w => w.trim()).filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const handleSignOut = useCallback(() => {
    start(async () => { await signOut(); });
  }, []);

  const closeSidebar = useCallback(() => setOpen(false), []);

  return (
    <div className="dv-shell" style={{ background: "var(--background)", color: "var(--text-primary)" }}>

      {/* ══ SIDEBAR (desktop + mobile drawer) ══ */}
      <aside className={`dv-sidebar ${open ? "dv-sidebar--open" : ""}`}>

        {/* Brand */}
        <div className="dv-sidebar__brand">
          <div className="dv-sidebar__logo">
            <img src="/logo.png" alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />
          </div>
          <div>
            <span className="dv-sidebar__wordmark">DukaVerse</span>
            <span className="dv-sidebar__tagline">Business platform</span>
          </div>
          {/* Mobile close button inside drawer */}
          <button className="dv-sidebar__close lg:hidden" onClick={closeSidebar} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        {/* Active branch pill */}
        {bizName && (
          <div className="dv-sidebar__branch">
            <p className="dv-sidebar__branch-label">Active business</p>
            <button className="dv-sidebar__branch-name">
              <span className="truncate">{bizName}</span>
              <ChevronDown size={13} style={{ flexShrink: 0, color: "#4E6A8A" }} />
            </button>
          </div>
        )}

        {/* Nav links */}
        <nav className="dv-sidebar__nav">
          {links.map(l => {
            const I = l.icon;
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={closeSidebar}
                className={`dv-nav-item${active ? " dv-nav-item--active" : ""}`}
                prefetch
              >
                <I size={17} />
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* User + sign out */}
        <div className="dv-sidebar__footer">
          {userName && (
            <div className="dv-sidebar__user">
              <div className="dv-sidebar__avatar">{initials}</div>
              <span className="dv-sidebar__username truncate">{userName}</span>
            </div>
          )}
          <button onClick={handleSignOut} disabled={pending} className="dv-nav-item dv-nav-item--signout">
            <LogOut size={15} />
            {pending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Backdrop */}
      {open && (
        <div
          className="dv-backdrop lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* ══ MAIN CONTENT ══ */}
      <main className="dv-main">

        {/* Top header */}
        {/* Header rendered by Header component */}

        {/* Page content */}
        <div className="dv-content">{children}</div>

        {/* Bottom spacer for mobile nav */}
        <div className="dv-bottom-spacer" />
      </main>

      {/* ══ MOBILE BOTTOM NAV ══ */}
      <nav className="dv-bottom-nav lg:hidden" role="navigation" aria-label="Main navigation">
        {links.map(l => {
          const I = l.icon;
          const active = path === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`dv-bottom-nav__item${active ? " dv-bottom-nav__item--active" : ""}`}
              prefetch
              aria-current={active ? "page" : undefined}
            >
              {active && <span className="dv-bottom-nav__indicator" aria-hidden="true" />}
              <I size={22} strokeWidth={active ? 2.2 : 1.8} />
              <span className="dv-bottom-nav__label">{l.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default memo(AppShell);








