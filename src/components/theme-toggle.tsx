"use client";

import { useTheme } from "@/components/theme-provider";
import { Moon, Sun, Contrast } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-[#1e2229] bg-[#0a0c0f] p-1"
      role="radiogroup"
      aria-label="Theme mode"
    >
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`rounded px-3 py-2 text-sm font-medium transition-all ${
          theme === "dark"
            ? "bg-amber-400 text-black"
            : "text-zinc-400 hover:text-zinc-200"
        }`}
        title="Dark mode"
        aria-label="Set dark mode"
        aria-pressed={theme === "dark"}
        role="radio"
        aria-checked={theme === "dark"}
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`rounded px-3 py-2 text-sm font-medium transition-all ${
          theme === "light"
            ? "bg-amber-400 text-black"
            : "text-zinc-400 hover:text-zinc-200"
        }`}
        title="Light mode"
        aria-label="Set light mode"
        aria-pressed={theme === "light"}
        role="radio"
        aria-checked={theme === "light"}
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme("high-contrast")}
        className={`rounded px-3 py-2 text-sm font-medium transition-all ${
          theme === "high-contrast"
            ? "bg-amber-400 text-black"
            : "text-zinc-400 hover:text-zinc-200"
        }`}
        title="High contrast mode"
        aria-label="Set high contrast mode"
        aria-pressed={theme === "high-contrast"}
        role="radio"
        aria-checked={theme === "high-contrast"}
      >
        <Contrast className="h-4 w-4" />
      </button>
    </div>
  );
}
