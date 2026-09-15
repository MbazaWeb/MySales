"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ReceiptText, Package,
  FileBarChart, UserRound, Menu, X,
  ChevronDown, LogOut, Bell, AlertTriangle, Clock,
} from "lucide-react";
import { useState, useTransition, useCallback, memo } from "react";
import { signOut } from "@/lib/supabase/server-actions";

const links = [
  { href: "/dashboard", label: "Dashboard",  icon: LayoutDashboard, shortLabel: "Home"    },
  { href: "/sales",     label: "Sales",      icon: ReceiptText,     shortLabel: "Sales"   },
  { href: "/inventory", label: "Inventory",  icon: Package,         shortLabel: "Stock"   },
  { href: "/reports",   label: "Reports",    icon: FileBarChart,    shortLabel: "Reports" },
  { href: "/profile",   label: "Profile",    icon: UserRound,       shortLabel: "Me"      },
];

interface AppShellProps {
  title:          string;
  subtitle:       string;
  children:       React.ReactNode;
  action?:        React.ReactNode;
  branchId?:      string;
  bizName?:       string;
  userName?:      string;
  trialEndsAt?:   string | null;
  time?:           string;
}

function trialInfo(trialEndsAt?: string | null): { days: number; show: boolean; urgent: boolean } {
  if (!trialEndsAt) return { days: 0, show: false, urgent: false };
  const days = Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return { days: 0, show: true, urgent: true };  // expired
  return { days, show: days <= 14, urgent: days <= 3 };
}

function AppShell({ title, subtitle, children, action, bizName, userName, trialEndsAt }: AppShellProps) {
  const path             = usePathname();
  const [open, setOpen]  = useState(false);
  const [pending, start] = useTransition();
  const trial            = trialInfo(trialEndsAt);

  const initials = (userName ?? "?")
    .split(" ").map(w => w.trim()).filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const handleSignOut  = useCallback(() => { start(async () => { await signOut(); }); }, []);
  const closeSidebar   = useCallback(() => setOpen(false), []);

  return (
    <div className="dv-shell" style={{ background: "var(--background)", color: "var(--text-primary)" }}>

      {/* ── Sidebar ── */}
      <aside className={`dv-sidebar ${open ? "dv-sidebar--open" : ""}`}>
        <div className="dv-sidebar__brand">
          <div className="dv-sidebar__logo">
            <img src="/logo.png" alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />
          </div>
          <div>
            <span className="dv-sidebar__wordmark">DukaVerse</span>
            <span className="dv-sidebar__tagline">Business platform</span>
          </div>
          <button className="dv-sidebar__close lg:hidden" onClick={closeSidebar} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        {bizName && (
          <div className="dv-sidebar__branch">
            <p className="dv-sidebar__branch-label">Active business</p>
            <button className="dv-sidebar__branch-name">
              <span className="truncate">{bizName}</span>
              <ChevronDown size={13} style={{ flexShrink: 0, color: "#4E6A8A" }} />
            </button>
          </div>
        )}

        {/* Trial badge in sidebar */}
        {trial.show && (
          <div className="mx-3 mt-2 mb-0 rounded-lg px-3 py-2.5"
            style={{
              background: trial.urgent ? "rgba(220,38,38,0.12)" : "rgba(201,168,76,0.12)",
              border:     `1px solid ${trial.urgent ? "rgba(220,38,38,0.3)" : "rgba(201,168,76,0.3)"}`,
            }}>
            <div className="flex items-center gap-1.5 mb-0.5">
              {trial.urgent
                ? <AlertTriangle size={12} style={{ color: "#F87171" }} />
                : <Clock size={12} style={{ color: "var(--gold-500)" }} />
              }
              <span className="text-xs font-semibold"
                style={{ color: trial.urgent ? "#F87171" : "var(--gold-500)" }}>
                {trial.days <= 0
                  ? "Trial expired"
                  : trial.days === 1 ? "1 day left"
                  : `${trial.days} days left`}
              </span>
            </div>
            <Link href="/profile" onClick={closeSidebar}
              className="text-xs"
              style={{ color: trial.urgent ? "rgba(248,113,113,0.7)" : "rgba(201,168,76,0.6)" }}>
              {trial.days <= 0 ? "Subscribe to continue" : "Upgrade now"}
            </Link>
          </div>
        )}

        <nav className="dv-sidebar__nav">
          {links.map(l => {
            const I      = l.icon;
            const active = path === l.href;
            return (
              <Link key={l.href} href={l.href} onClick={closeSidebar}
                className={`dv-nav-item${active ? " dv-nav-item--active" : ""}`} prefetch>
                <I size={17} />
                {l.label}
              </Link>
            );
          })}
        </nav>

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
      {open && <div className="dv-backdrop lg:hidden" onClick={closeSidebar} aria-hidden="true" />}

      {/* ── Main ── */}
      <main className="dv-main">
        <header className="dv-header">
          <div className="dv-header__left">
            <button className="dv-header__menu-btn lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu size={21} />
            </button>
            <div className="dv-header__titles">
              <h1 className="dv-header__title">{title}</h1>
              <p className="dv-header__subtitle">{subtitle}</p>
            </div>
          </div>

          <div className="dv-header__actions">
            {action}

            {/* Trial badge in header — always visible */}
            {trial.show && (
              <Link href="/profile"
                className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
                style={{
                  background: trial.urgent
                    ? "rgba(220,38,38,0.1)"
                    : "rgba(201,168,76,0.12)",
                  color:  trial.urgent ? "var(--danger)" : "var(--gold-500)",
                  border: `1px solid ${trial.urgent ? "rgba(220,38,38,0.25)" : "rgba(201,168,76,0.3)"}`,
                }}>
                {trial.urgent
                  ? <AlertTriangle size={12} />
                  : <Clock size={12} />
                }
                {trial.days <= 0
                  ? "Trial expired"
                  : trial.days === 1 ? "1 day left"
                  : `${trial.days} days left`}
              </Link>
            )}

            <button className="dv-header__notif" aria-label="Notifications">
              <Bell size={18} />
            </button>
          </div>
        </header>

        <div className="dv-content">{children}</div>
        <div className="dv-bottom-spacer" />
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="dv-bottom-nav lg:hidden" role="navigation" aria-label="Main navigation">
        {links.map(l => {
          const I      = l.icon;
          const active = path === l.href;
          return (
            <Link key={l.href} href={l.href}
              className={`dv-bottom-nav__item${active ? " dv-bottom-nav__item--active" : ""}`}
              prefetch aria-current={active ? "page" : undefined}>
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
