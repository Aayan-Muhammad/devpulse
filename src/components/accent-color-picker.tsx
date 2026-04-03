"use client";

import { useTheme } from "@/components/theme-provider";
import type { AccentColor } from "@/components/theme-provider";

const accentOptions: Array<{ name: AccentColor; label: string; color: string }> = [
  { name: "amber", label: "Amber", color: "#fbbf24" },
  { name: "blue", label: "Blue", color: "#3b82f6" },
  { name: "emerald", label: "Emerald", color: "#10b981" },
  { name: "purple", label: "Purple", color: "#a855f7" },
  { name: "pink", label: "Pink", color: "#ec4899" },
  { name: "cyan", label: "Cyan", color: "#06b6d4" },
  { name: "orange", label: "Orange", color: "#f97316" },
  { name: "rose", label: "Rose", color: "#f43f5e" },
];

export function AccentColorPicker() {
  const { accentColor, setAccentColor } = useTheme();

  return (
    <div>
      <p className="mb-3 text-xs uppercase tracking-widest text-zinc-500">Accent Color</p>
      <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Accent color">
        {accentOptions.map(({ name, label, color }) => (
          <button
            key={name}
            type="button"
            onClick={() => setAccentColor(name)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all ${
              accentColor === name
                ? "border-white"
                : "border-transparent hover:border-zinc-500"
            }`}
            style={{ backgroundColor: color }}
            title={label}
            aria-label={`Set accent color ${label}`}
            aria-pressed={accentColor === name}
            role="radio"
            aria-checked={accentColor === name}
          >
            {accentColor === name && (
              <span className="text-xs font-bold text-black">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
