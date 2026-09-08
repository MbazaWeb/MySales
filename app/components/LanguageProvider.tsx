"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { isLanguage, LANGUAGE_KEY, translate, type Language } from "../i18n";

const LanguageContext = createContext<{ lang: Language; setLanguage: (lang: Language) => void }>({ lang: "en", setLanguage: () => {} });

export function LanguageProvider({ children, initialLanguage = "en" }: { children: ReactNode; initialLanguage?: Language }) {
  const [lang, setLang] = useState<Language>(initialLanguage);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_KEY);
      if (isLanguage(saved)) setLang(saved);
    } catch { /* Language switching remains available when storage is blocked. */ }
    const onStorage = (event: StorageEvent) => {
      if (event.key === LANGUAGE_KEY) setLang(isLanguage(event.newValue) ? event.newValue : "en");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  function setLanguage(next: Language) {
    setLang(next);
    try { localStorage.setItem(LANGUAGE_KEY, next); } catch { /* Keep the in-memory choice. */ }
  }

  return <LanguageContext.Provider value={{ lang, setLanguage }}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const { lang, setLanguage } = useContext(LanguageContext);
  return { lang, setLanguage, locale: lang === "sw" ? "sw-TZ" : "en-TZ", t: (en: string, sw?: string) => sw === undefined ? translate(en, lang) : lang === "sw" ? sw : en };
}

/** Also works inside server-rendered pages without moving data fetching into the browser. */
export function T({ text }: { text: string }) {
  const { t } = useTranslation();
  return <>{t(text)}</>;
}

export function LocalizedDate({ value, options }: { value: string; options?: Intl.DateTimeFormatOptions }) {
  const { locale } = useTranslation();
  return <>{new Date(value).toLocaleString(locale, { timeZone: "Africa/Dar_es_Salaam", ...options })}</>;
}
