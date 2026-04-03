"use client";

import { useEffect, useState } from "react";

const DENSITY_KEY = "devpulse-density";
const HINTS_KEY = "devpulse-show-hints";

type DensityMode = "comfortable" | "compact";

export function DisplayPreferences() {
  const [density, setDensity] = useState<DensityMode>("comfortable");
  const [showHints, setShowHints] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedDensity = window.localStorage.getItem(DENSITY_KEY);
    const savedHints = window.localStorage.getItem(HINTS_KEY);

    if (savedDensity === "comfortable" || savedDensity === "compact") {
      setDensity(savedDensity);
    }

    if (savedHints === "true" || savedHints === "false") {
      setShowHints(savedHints === "true");
    }
  }, []);

  const handleSave = () => {
    window.localStorage.setItem(DENSITY_KEY, density);
    window.localStorage.setItem(HINTS_KEY, String(showHints));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  };

  return (
    <div className="rounded-xl border border-[#1e2229] bg-[#111318] p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-100">Display Preferences</h2>
        <p className="text-sm text-zinc-400">Local settings saved in this browser only.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-xs uppercase tracking-widest text-zinc-500">
            Layout density
          </span>
          <select
            value={density}
            onChange={(event) => setDensity(event.target.value as DensityMode)}
            className="h-11 w-full rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-3 text-zinc-100 outline-none transition-colors focus:border-amber-400"
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </label>

        <label className="flex h-11 items-center justify-between gap-3 rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-3 text-sm text-zinc-100">
          <span className="text-xs uppercase tracking-widest text-zinc-500">Show helper hints</span>
          <input
            type="checkbox"
            checked={showHints}
            onChange={(event) => setShowHints(event.target.checked)}
            className="h-4 w-4 accent-amber-400"
          />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-[#0d0f12] transition-colors hover:bg-amber-300"
        >
          Save preferences
        </button>
        <span className="text-xs text-zinc-500">{saved ? "Saved" : " "}</span>
      </div>
    </div>
  );
}