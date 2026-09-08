"use client";
import { T, LocalizedDate, useTranslation } from "@/app/components/LanguageProvider";

import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";
import { Bell } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle: string;
  time?: string;
  action?: React.ReactNode;
}

export function Header({ title, subtitle, time, action }: HeaderProps) {
  const { t: translateUi } = useTranslation();
  return (
    <header className="dv-header">
      <div className="dv-header__left">
        <div className="dv-header__titles">
          <h1 className="dv-header__title"><T text={title} /></h1>
          {time && (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}><LocalizedDate value={time} options={{ weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }} /></span>
            </div>
          )}
          <p className="dv-header__subtitle"><T text={subtitle} /></p>
        </div>
      </div>
      <div className="dv-header__actions">
        {action}
        <ThemeToggle />
        <LanguageToggle />
        <button className="dv-header__notif" aria-label={translateUi("Notifications")}>
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
