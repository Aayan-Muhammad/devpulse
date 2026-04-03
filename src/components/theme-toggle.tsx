"use client";

import { useTheme } from "@/components/theme-provider";
import { Moon, Sun, Contrast } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2 rounded-lg border border-[#1e2229] bg-[#0a0c0f] p-1">
      <button
        onClick={() => setTheme("dark")}
        className={`rounded px-3 py-2 text-sm font-medium transition-all ${
          theme === "dark"
            ? "bg-amber-400 text-black"
            : "text-zinc-400 hover:text-zinc-200"
        }`}
        title="Dark mode"
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme("light")}
        className={`rounded px-3 py-2 text-sm font-medium transition-all ${
          theme === "light"
            ? "bg-amber-400 text-black"
            : "text-zinc-400 hover:text-zinc-200"
        }`}
        title="Light mode"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme("high-contrast")}
        className={`rounded px-3 py-2 text-sm font-medium transition-all ${
          theme === "high-contrast"
            ? "bg-amber-400 text-black"
            : "text-zinc-400 hover:text-zinc-200"
        }`}
        title="High contrast mode"
      >
        <Contrast className="h-4 w-4" />
      </button>
    </div>
  );
}
