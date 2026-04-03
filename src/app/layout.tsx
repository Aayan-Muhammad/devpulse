import type { Metadata } from "next";
import { Providers } from "@/app/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevPulse",
  description: "Your developer activity dashboard",
};

const themeBootScript = `
(() => {
  try {
    const savedTheme = localStorage.getItem("devpulse-theme");
    const savedAccent = localStorage.getItem("devpulse-accent");
    const systemTheme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    const root = document.documentElement;
    const effectiveTheme = savedTheme === "light" || savedTheme === "high-contrast" ? savedTheme : savedTheme === "system" ? systemTheme : "dark";

    root.classList.remove("light", "high-contrast");
    if (effectiveTheme === "light") root.classList.add("light");
    if (effectiveTheme === "high-contrast") root.classList.add("high-contrast");
    root.dataset.theme = effectiveTheme;
    root.dataset.themePreference = savedTheme || "dark";

    const accentMap = {
      amber: "#fbbf24",
      blue: "#3b82f6",
      emerald: "#10b981",
      purple: "#a855f7",
      pink: "#ec4899",
      cyan: "#06b6d4",
      orange: "#f97316",
      rose: "#f43f5e",
    };

    if (savedAccent && accentMap[savedAccent]) {
      root.style.setProperty("--accent-color", accentMap[savedAccent]);
    }
  } catch {}
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-screen bg-[#0a0c0f] text-zinc-200 antialiased">
        <div className="dp-app-shell min-h-screen">
          <div className="dp-app-shell__ambient" aria-hidden="true">
            <span className="dp-orb dp-orb--slow dp-app-shell__orb dp-app-shell__orb--one" />
            <span className="dp-orb dp-app-shell__orb dp-app-shell__orb--two" />
            <span className="dp-app-shell__texture" />
            <span className="dp-app-shell__vignette" />
          </div>
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}