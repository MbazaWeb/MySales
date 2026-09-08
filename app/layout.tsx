import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DukaVerse",
  description: "Multi-branch sales and inventory management",
  other: { "codex-preview": "development" },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/app-icon.png", type: "image/png", sizes: "1254x1254" },
    ],
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
