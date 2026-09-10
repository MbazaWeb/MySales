"use client";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle }    from "./ThemeToggle";
import { Bell }           from "lucide-react";

interface HeaderProps {
  title:     string;
  subtitle:  string;
  time?:     string;
  action?:   React.ReactNode;
}

export function Header({ title, subtitle, time, action }: HeaderProps) {
  return (
    <header className="dv-header">
      <div className="dv-header__left">
        <div className="dv-header__titles">
          <h1 className="dv-header__title">{title}</h1>
          {time && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{time}</span>
          )}
          <p className="dv-header__subtitle">{subtitle}</p>
        </div>
      </div>
      <div className="dv-header__actions">
        {action}
        <ThemeToggle />
        <LanguageToggle />
        <button className="dv-header__notif" aria-label="Notifications">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
