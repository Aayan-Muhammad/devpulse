"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { AccentColorPicker } from "@/components/accent-color-picker";

export function AppearanceSection() {
  return (
    <section className="dp-surface dp-reveal [animation-delay:200ms] rounded-xl p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-zinc-100">Appearance</h2>
        <p className="mt-1 text-sm text-zinc-400">Customize your DevPulse experience.</p>
      </div>

      <div className="space-y-5">
        <div>
          <p className="mb-3 text-xs uppercase tracking-widest text-zinc-500">Theme</p>
          <ThemeToggle />
        </div>

        <div>
          <AccentColorPicker />
        </div>
      </div>
    </section>
  );
}
