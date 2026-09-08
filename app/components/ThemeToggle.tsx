"use client";
import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = ""light"" | ""dark"";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(""light"");

  useEffect(() => {
    const saved = localStorage.getItem(""dv_theme"") as Theme;
    const prefersDark = window.matchMedia(""(prefers-color-scheme: dark)"").matches;
    const initial = saved || (prefersDark ? ""dark"" : ""light"");
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const applyTheme = (t: Theme) => {
    document.documentElement.setAttribute(""data-theme"", t);
    document.documentElement.style.colorScheme = t;
  };

  const toggleTheme = () => {
    const next = theme === ""light"" ? ""dark"" : ""light"";
    setTheme(next);
    localStorage.setItem(""dv_theme"", next);
    applyTheme(next);
  };

  return (
    <button
      onClick={toggleTheme}
      className=""rounded-lg p-2 transition-colors""
      style={{
        background: ""var(--surface)"",
        border: ""1px solid var(--border)"",
        color: ""var(--text-secondary)"",
      }}
      aria-label=""Toggle theme""
    >
      {theme === ""light"" ? (
        <Moon size={18} />
      ) : (
        <Sun size={18} style={{ color: ""var(--gold-500)"" }} />
      )}
    </button>
  );
}
