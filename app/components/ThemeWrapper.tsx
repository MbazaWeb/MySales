"use client";
import { useEffect } from "react";

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const saved = localStorage.getItem(""dv_theme"");
    const prefersDark = window.matchMedia(""(prefers-color-scheme: dark)"").matches;
    const theme = saved || (prefersDark ? ""dark"" : ""light"");
    document.documentElement.setAttribute(""data-theme"", theme);
    
    const lang = localStorage.getItem(""dv_language"") || ""en"";
    document.documentElement.lang = lang;
  }, []);

  return <>{children}</>;
}
