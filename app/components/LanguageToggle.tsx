"use client";
import { useState, useEffect } from "react";
import { Languages, ChevronDown } from "lucide-react";

type Language = "en" | "sw";

export function LanguageToggle({ className }: { className?: string }) {
  const [language, setLanguage] = useState<Language>("en");
  const [open, setOpen]         = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("dv_language") as Language;
    if (saved === "en" || saved === "sw") {
      setLanguage(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const toggleLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("dv_language", lang);
    document.documentElement.lang = lang;
    setOpen(false);
    window.dispatchEvent(new Event("languagechange"));
  };

  const labels: Record<Language, string> = {
    en: "English",
    sw: "Kiswahili",
  };

  return (
    <div className={`relative ${className ?? ""}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        style={{
          background: "var(--surface)",
          border:     "1px solid var(--border)",
          color:      "var(--text-secondary)",
        }}
      >
        <Languages size={16} />
        <span>{labels[language]}</span>
        <ChevronDown size={14} style={{ opacity: 0.5 }} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-lg shadow-lg overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            {(["en", "sw"] as Language[]).map(lang => (
              <button
                key={lang}
                onClick={() => toggleLanguage(lang)}
                className="w-full px-4 py-2.5 text-sm text-left transition-colors"
                style={{
                  color:      language === lang ? "var(--gold-500)" : "var(--text-primary)",
                  background: language === lang ? "var(--gold-100)"  : "transparent",
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

export function useTranslation() {
  const [lang, setLang] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("dv_language") as Language;
    if (saved === "en" || saved === "sw") setLang(saved);

    const handler = () => {
      const current = localStorage.getItem("dv_language") as Language;
      if (current === "en" || current === "sw") setLang(current);
    };
    window.addEventListener("languagechange", handler);
    return () => window.removeEventListener("languagechange", handler);
  }, []);

  const t = (en: string, sw: string): string => lang === "sw" ? sw : en;

  return { t, lang };
}
