"use client";
import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [hiding, setHiding]   = useState(false);

  useEffect(() => {
    // Only show once per session
    if (sessionStorage.getItem("dv_splash_done")) return;
    setVisible(true);
    const t1 = setTimeout(() => setHiding(true), 1600);
    const t2 = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem("dv_splash_done", "1");
    }, 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position:         "fixed",
        inset:            0,
        zIndex:           9999,
        background:       "var(--navy-900)",
        display:          "flex",
        flexDirection:    "column",
        alignItems:       "center",
        justifyContent:   "center",
        gap:              "1.25rem",
        opacity:          hiding ? 0 : 1,
        transition:       "opacity 480ms ease",
        pointerEvents:    hiding ? "none" : "all",
      }}
    >
      {/* Logo mark */}
      <div style={{
        width: 80, height: 80, borderRadius: 22,
        background: "var(--gold-500)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 0 12px rgba(201,168,76,0.15), 0 0 0 24px rgba(201,168,76,0.07)",
        animation: "splash-pulse 1.6s ease-in-out infinite",
      }}>
        <img src="/logo.png" alt="DukaVerse" style={{ width: 52, height: 52, objectFit: "contain" }} />
      </div>

      {/* Wordmark */}
      <div style={{ textAlign: "center" }}>
        <p style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: "1.875rem",
          fontWeight: 700,
          color: "#fff",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}>
          DukaVerse
        </p>
        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: "0.375rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Business platform
        </p>
      </div>

      {/* Loading dots */}
      <div style={{ display: "flex", gap: "0.375rem", marginTop: "0.5rem" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "var(--gold-500)",
            opacity: 0.4,
            animation: `splash-dot 1.2s ${i * 0.2}s ease-in-out infinite`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes splash-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes splash-dot {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}