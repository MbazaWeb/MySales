"use client";
import { useState } from "react";
import { useTranslation } from "./LanguageProvider";
import type { Language } from "../i18n";
import { Languages, ChevronDown } from "lucide-react";



interface LanguageToggleProps {
  className?: string;
}

export function LanguageToggle({ className }: LanguageToggleProps) {
  const { lang: language, setLanguage } = useTranslation();
  const [open, setOpen] = useState(false);

  const toggleLanguage = (lang: Language) => {
    setLanguage(lang);
    setOpen(false);
  };

  const labels: Record<Language, string> = {
    en: "English",
    sw: "Kiswahili",
  };

  return (
    <div className={["relative", className].filter(Boolean).join(" ")}>
      <button
        type="button"
        aria-label={language === "sw" ? "Chagua lugha" : "Choose language"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: "var(--text-secondary)",
        }}
      >
        <Languages size={16} />
        <span>{labels[language]}</span>
        <ChevronDown size={14} style={{ opacity: 0.5 }} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-lg shadow-lg overflow-hidden"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            {(["en", "sw"] as Language[]).map((lang) => (
              <button
                key={lang}
                type="button"
                aria-pressed={language === lang}
                onClick={() => toggleLanguage(lang)}
                className="w-full px-4 py-2.5 text-sm text-left transition-colors hover:bg-muted"
                style={{
                  color: language === lang ? "var(--gold-500)" : "var(--text-primary)",
                  background: language === lang ? "var(--gold-100)" : "transparent",
                  fontWeight: language === lang ? 600 : 400,
                }}
              >
                {labels[lang]}
                {language === lang && (
                  <span className="ml-2" style={{ color: "var(--gold-500)" }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


export { useTranslation } from "./LanguageProvider";
