"use client";
import { useEffect } from "react";
import { LanguageProvider } from "./LanguageProvider";

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const saved = localStorage.getItem("dv_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = saved || (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
    

  }, []);

  return <LanguageProvider>{children}</LanguageProvider>;
}
