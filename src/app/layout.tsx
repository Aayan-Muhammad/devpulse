import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Providers } from "@/app/providers";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "DevPulse",
  description: "Your developer activity dashboard",
};

const themeBootScript = `
(() => {
  try {
    const savedTheme = localStorage.getItem("devpulse-theme");
    const savedAccent = localStorage.getItem("devpulse-accent");
    const root = document.documentElement;

    root.classList.remove("light", "high-contrast");
    if (savedTheme === "light") root.classList.add("light");
    if (savedTheme === "high-contrast") root.classList.add("high-contrast");

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
    <html lang="en" className={jetbrainsMono.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-screen bg-[#0a0c0f] text-zinc-200">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}