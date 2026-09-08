import type { Metadata, Viewport } from "next";
import "./globals.css";
import SplashScreen from "./components/SplashScreen";
import { ShimmerCSS } from "./components/Skeleton";
import { ThemeWrapper } from "./components/ThemeWrapper";
import { ThemeWrapper } from "./components/ThemeWrapper";
import { ThemeWrapper } from "./components/ThemeWrapper";

export const metadata: Metadata = {
  title: "DukaVerse",
  description: "Multi-branch sales and inventory management for East African businesses",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DukaVerse",
  },
  icons: {
    icon:      [{ url: "/favicon.png", type: "image/png" }, { url: "/app-icon.png", type: "image/png", sizes: "1254x1254" }],
    shortcut:  "/favicon.png",
    apple:     "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width:                    "device-width",
  initialScale:             1,
  maximumScale:             1,
  userScalable:             false,
  viewportFit:              "cover",
  themeColor:               "#0F1B2D",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="antialiased">
        <ShimmerCSS />
        <SplashScreen />
        {children}
              </ThemeWrapper>
    </body>
    </html>
  );
}





