"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  DENSITY_KEY,
  HINTS_KEY,
  LAST_VISIT_HISTORY_PREFIX,
  LAST_VISIT_PREFIX,
  TREND_HISTORY_UPDATED_EVENT,
  TREND_HISTORY_ENABLED_KEY,
  TREND_TIMELINE_DELTA_MODE_KEY,
  TREND_TIMELINE_SHOW_PUSHES_KEY,
  TREND_TIMELINE_SHOW_REPOS_KEY,
  TREND_TIMELINE_SHOW_STARS_KEY,
  TREND_TIMELINE_WINDOW_KEY,
  TREND_HISTORY_TTL_DAYS_KEY,
} from "@/lib/preferences";
import {
  computeEntriesChecksum,
  computeHmacHex,
  isValidTrendSnapshot,
  type TrendSnapshot,
} from "@/lib/trend-history-portability";
import {
  computeDryRunCounts,
  computeTrendResetBackup,
  extractAndNormalizeTrendEntries,
  restoreTrendBackup,
  validateTrendImportEnvelope,
} from "@/lib/trend-history-workflow";

type DensityMode = "comfortable" | "compact";
type ImportMode = "merge" | "replace";
type TtlDaysMode = "7" | "30" | "90" | "0";
type TimelineWindowMode = "24h" | "7d" | "30d" | "all";
type TimelineDeltaMode = "absolute" | "percent";
type PendingImport = {
  sourceFileName: string;
  entries: Record<string, string>;
  usernames: string[];
  skippedCount: number;
  mergeNewCount: number;
  mergeOverwriteCount: number;
  sourceVersion: number;
  checksumVerified: boolean;
  signatureRequired: boolean;
  signatureVerified: boolean;
};
type TrendStats = {
  userCount: number;
  entryCount: number;
  newestAt: number | null;
  oldestAt: number | null;
};

export function DisplayPreferences() {
  const [density, setDensity] = useState<DensityMode>("comfortable");
  const [showHints, setShowHints] = useState(true);
  const [trackHistory, setTrackHistory] = useState(true);
  const [ttlDays, setTtlDays] = useState<TtlDaysMode>("30");
  const [timelineWindow, setTimelineWindow] = useState<TimelineWindowMode>("7d");
  const [timelineDeltaMode, setTimelineDeltaMode] = useState<TimelineDeltaMode>("absolute");
  const [showTimelinePushes, setShowTimelinePushes] = useState(true);
  const [showTimelineStars, setShowTimelineStars] = useState(true);
  const [showTimelineRepos, setShowTimelineRepos] = useState(true);
  const [signExport, setSignExport] = useState(false);
  const [exportPassphrase, setExportPassphrase] = useState("");
  const [importPassphrase, setImportPassphrase] = useState("");
  const [importMode, setImportMode] = useState<ImportMode>("merge");
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [resetBackup, setResetBackup] = useState<Record<string, string> | null>(null);
  const resetUndoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [trendStats, setTrendStats] = useState<TrendStats>({
    userCount: 0,
    entryCount: 0,
    newestAt: null,
    oldestAt: null,
  });

  const collectTrendStats = () => {
    try {
      const users = new Set<string>();
      let entryCount = 0;
      let newestAt: number | null = null;
      let oldestAt: number | null = null;

      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (!key) continue;

        const isTrendKey =
          key.startsWith(`${LAST_VISIT_PREFIX}:`) || key.startsWith(`${LAST_VISIT_HISTORY_PREFIX}:`);
        if (!isTrendKey) continue;

        const user = key.split(":")[1];
        if (user) users.add(user);

        const value = window.localStorage.getItem(key);
        if (!value) continue;

        try {
          const parsed = JSON.parse(value) as unknown;
          if (Array.isArray(parsed)) {
            parsed.filter(isValidTrendSnapshot).forEach((snapshot) => {
              entryCount += 1;
              newestAt = newestAt === null ? snapshot.savedAt : Math.max(newestAt, snapshot.savedAt);
              oldestAt = oldestAt === null ? snapshot.savedAt : Math.min(oldestAt, snapshot.savedAt);
            });
          } else if (isValidTrendSnapshot(parsed)) {
            entryCount += 1;
            newestAt = newestAt === null ? parsed.savedAt : Math.max(newestAt, parsed.savedAt);
            oldestAt = oldestAt === null ? parsed.savedAt : Math.min(oldestAt, parsed.savedAt);
          }
        } catch {
          // Ignore malformed values while collecting stats.
        }
      }

      setTrendStats({
        userCount: users.size,
        entryCount,
        newestAt,
        oldestAt,
      });
    } catch {
      setTrendStats({ userCount: 0, entryCount: 0, newestAt: null, oldestAt: null });
    }
  };

  const triggerTrendRecompute = () => {
    try {
      window.localStorage.setItem(TREND_HISTORY_UPDATED_EVENT, String(Date.now()));
      window.dispatchEvent(new CustomEvent(TREND_HISTORY_UPDATED_EVENT));
    } catch {
      // Ignore storage exceptions to keep settings responsive.
    }
  };

  useEffect(() => {
    return () => {
      if (resetUndoTimerRef.current) {
        clearTimeout(resetUndoTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const savedDensity = window.localStorage.getItem(DENSITY_KEY);
    const savedHints = window.localStorage.getItem(HINTS_KEY);
    const savedHistoryTracking = window.localStorage.getItem(TREND_HISTORY_ENABLED_KEY);
    const savedTtlDays = window.localStorage.getItem(TREND_HISTORY_TTL_DAYS_KEY);
    const savedTimelineWindow = window.localStorage.getItem(TREND_TIMELINE_WINDOW_KEY);
    const savedTimelineDeltaMode = window.localStorage.getItem(TREND_TIMELINE_DELTA_MODE_KEY);
    const savedTimelinePushes = window.localStorage.getItem(TREND_TIMELINE_SHOW_PUSHES_KEY);
    const savedTimelineStars = window.localStorage.getItem(TREND_TIMELINE_SHOW_STARS_KEY);
    const savedTimelineRepos = window.localStorage.getItem(TREND_TIMELINE_SHOW_REPOS_KEY);

    if (savedDensity === "comfortable" || savedDensity === "compact") {
      setDensity(savedDensity);
    }

    if (savedHints === "true" || savedHints === "false") {
      setShowHints(savedHints === "true");
    }

    if (savedHistoryTracking === "true" || savedHistoryTracking === "false") {
      setTrackHistory(savedHistoryTracking === "true");
    }

    if (savedTtlDays === "7" || savedTtlDays === "30" || savedTtlDays === "90" || savedTtlDays === "0") {
      setTtlDays(savedTtlDays);
    }

    if (savedTimelineWindow === "24h" || savedTimelineWindow === "7d" || savedTimelineWindow === "30d" || savedTimelineWindow === "all") {
      setTimelineWindow(savedTimelineWindow);
    }

    if (savedTimelineDeltaMode === "absolute" || savedTimelineDeltaMode === "percent") {
      setTimelineDeltaMode(savedTimelineDeltaMode);
    }

    if (savedTimelinePushes === "true" || savedTimelinePushes === "false") {
      setShowTimelinePushes(savedTimelinePushes === "true");
    }

    if (savedTimelineStars === "true" || savedTimelineStars === "false") {
      setShowTimelineStars(savedTimelineStars === "true");
    }

    if (savedTimelineRepos === "true" || savedTimelineRepos === "false") {
      setShowTimelineRepos(savedTimelineRepos === "true");
    }

    collectTrendStats();
  }, []);

  const handleSave = () => {
    window.localStorage.setItem(DENSITY_KEY, density);
    window.localStorage.setItem(HINTS_KEY, String(showHints));
    window.localStorage.setItem(TREND_HISTORY_ENABLED_KEY, String(trackHistory));
    window.localStorage.setItem(TREND_HISTORY_TTL_DAYS_KEY, ttlDays);
    window.localStorage.setItem(TREND_TIMELINE_WINDOW_KEY, timelineWindow);
    window.localStorage.setItem(TREND_TIMELINE_DELTA_MODE_KEY, timelineDeltaMode);
    window.localStorage.setItem(TREND_TIMELINE_SHOW_PUSHES_KEY, String(showTimelinePushes));
    window.localStorage.setItem(TREND_TIMELINE_SHOW_STARS_KEY, String(showTimelineStars));
    window.localStorage.setItem(TREND_TIMELINE_SHOW_REPOS_KEY, String(showTimelineRepos));
    triggerTrendRecompute();
    collectTrendStats();
    toast.success("Display preferences saved!");
  };

  const resetTimelineViewPrefs = () => {
    try {
      window.localStorage.removeItem(TREND_TIMELINE_WINDOW_KEY);
      window.localStorage.removeItem(TREND_TIMELINE_DELTA_MODE_KEY);
      window.localStorage.removeItem(TREND_TIMELINE_SHOW_PUSHES_KEY);
      window.localStorage.removeItem(TREND_TIMELINE_SHOW_STARS_KEY);
      window.localStorage.removeItem(TREND_TIMELINE_SHOW_REPOS_KEY);

      setTimelineWindow("7d");
      setTimelineDeltaMode("absolute");
      setShowTimelinePushes(true);
      setShowTimelineStars(true);
      setShowTimelineRepos(true);

      triggerTrendRecompute();
      toast.success("Timeline view defaults restored.");
    } catch {
      toast.error("Could not reset timeline view defaults.");
    }
  };

  const exportTrendHistory = () => {
    void (async () => {
      try {
      const entries: Record<string, string> = {};

      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (!key) continue;

        if (key.startsWith(`${LAST_VISIT_PREFIX}:`) || key.startsWith(`${LAST_VISIT_HISTORY_PREFIX}:`)) {
          const value = window.localStorage.getItem(key);
          if (value !== null) {
            entries[key] = value;
          }
        }
      }

      const checksum = computeEntriesChecksum(entries);

      if (signExport) {
        if (!exportPassphrase.trim()) {
          toast.error("Enter an export passphrase to sign this file.");
          return;
        }

        const message = `3:${checksum}`;
        const signature = await computeHmacHex(message, exportPassphrase);

        const payload = {
          exportedAt: new Date().toISOString(),
          version: 3,
          checksum,
          signatureAlgorithm: "HMAC-SHA-256",
          signature,
          entries,
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `devpulse-trend-history-${Date.now()}.json`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);

        toast.success("Signed trend history exported.");
        return;
      }

      const payload = {
        exportedAt: new Date().toISOString(),
        version: 2,
        checksum,
        entries,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `devpulse-trend-history-${Date.now()}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      toast.success("Trend history exported.");
      } catch {
        toast.error("Could not export trend history.");
      }
    })();
  };

  const resetTrendHistory = () => {
    const confirmed = window.confirm(
      "Clear all locally saved trend history for DevPulse on this browser?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const currentEntries: Record<string, string> = {};

      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (!key) continue;

        const value = window.localStorage.getItem(key);
        if (value !== null) {
          currentEntries[key] = value;
        }
      }

      const { keysToRemove, backup } = computeTrendResetBackup(currentEntries);

      keysToRemove.forEach((key) => window.localStorage.removeItem(key));
      setResetBackup(backup);
      if (resetUndoTimerRef.current) {
        clearTimeout(resetUndoTimerRef.current);
      }
      resetUndoTimerRef.current = setTimeout(() => {
        setResetBackup(null);
      }, 10000);
      triggerTrendRecompute();
      collectTrendStats();
      toast.success("Trend history cleared. Undo is available for 10 seconds.");
    } catch {
      toast.error("Could not clear trend history.");
    }
  };

  const undoResetTrendHistory = () => {
    if (!resetBackup) {
      return;
    }

    try {
      const currentEntries: Record<string, string> = {};
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (!key) continue;
        const value = window.localStorage.getItem(key);
        if (value !== null) {
          currentEntries[key] = value;
        }
      }

      const restoredEntries = restoreTrendBackup(currentEntries, resetBackup);
      Object.entries(restoredEntries).forEach(([key, value]) => window.localStorage.setItem(key, value));
      setResetBackup(null);
      if (resetUndoTimerRef.current) {
        clearTimeout(resetUndoTimerRef.current);
      }
      triggerTrendRecompute();
      collectTrendStats();
      toast.success("Trend history restored.");
    } catch {
      toast.error("Could not restore trend history.");
    }
  };

  const importTrendHistory = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        version?: number;
        checksum?: string;
        signature?: string;
        signatureAlgorithm?: string;
        entries?: Record<string, unknown>;
      };

      const validated = await validateTrendImportEnvelope(parsed, importPassphrase);
      const { acceptedEntries, usernames, skippedCount } = extractAndNormalizeTrendEntries(
        parsed.entries ?? {}
      );

      const existingKeys = new Set<string>();
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (key) {
          existingKeys.add(key);
        }
      }

      const dryRun = computeDryRunCounts(acceptedEntries, existingKeys, "merge");

      if (Object.keys(acceptedEntries).length === 0) {
        toast.error("No trend history entries found in this file.");
      } else {
        setPendingImport({
          sourceFileName: file.name,
          entries: acceptedEntries,
          usernames,
          skippedCount,
          mergeNewCount: dryRun.newCount,
          mergeOverwriteCount: dryRun.overwriteCount,
          sourceVersion: validated.sourceVersion,
          checksumVerified: validated.checksumVerified,
          signatureRequired: validated.signatureRequired,
          signatureVerified: validated.signatureVerified,
        });
        toast.success("Import file parsed. Review preview and apply.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not import trend history.";
      toast.error(message);
    } finally {
      event.target.value = "";
    }
  };

  const applyPendingImport = () => {
    if (!pendingImport) {
      return;
    }

    try {
      if (importMode === "replace") {
        const keysToRemove: string[] = [];

        for (let index = 0; index < window.localStorage.length; index += 1) {
          const key = window.localStorage.key(index);
          if (!key) continue;

          if (key.startsWith(`${LAST_VISIT_PREFIX}:`) || key.startsWith(`${LAST_VISIT_HISTORY_PREFIX}:`)) {
            keysToRemove.push(key);
          }
        }

        keysToRemove.forEach((key) => window.localStorage.removeItem(key));
      }

      const entryList = Object.entries(pendingImport.entries);
      entryList.forEach(([key, value]) => window.localStorage.setItem(key, value));

      triggerTrendRecompute();
      collectTrendStats();
      toast.success(
        `Imported ${entryList.length} entr${entryList.length === 1 ? "y" : "ies"} using ${importMode} mode.`
      );
      setPendingImport(null);
    } catch {
      toast.error("Could not apply imported trend history.");
    }
  };

  const runRecomputeNow = () => {
    triggerTrendRecompute();
    collectTrendStats();
    toast.success("Timeline recompute triggered.");
  };

  const formatDateTime = (value: number | null) => {
    if (value === null) return "N/A";
    return new Date(value).toLocaleString();
  };

  const previewNewCount = pendingImport
    ? importMode === "replace"
      ? Object.keys(pendingImport.entries).length
      : pendingImport.mergeNewCount
    : 0;

  const previewOverwriteCount = pendingImport
    ? importMode === "replace"
      ? 0
      : pendingImport.mergeOverwriteCount
    : 0;

  return (
    <div className="dp-reveal [animation-delay:240ms] rounded-xl border border-[#1e2229] bg-[#111318] p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-zinc-100">Display Preferences</h2>
        <p className="text-sm text-zinc-400">Local settings saved in this browser only.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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

        <div className="text-sm">
          <span className="mb-1 block text-xs uppercase tracking-widest text-zinc-500">
            Show helper hints
          </span>
          <label className="flex h-11 items-center justify-between gap-3 rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-3 text-sm text-zinc-100">
            <span className="text-sm text-zinc-300">Enable hints</span>
            <input
              type="checkbox"
              checked={showHints}
              onChange={(event) => setShowHints(event.target.checked)}
              className="h-4 w-4 accent-amber-400"
            />
          </label>
        </div>

        <div className="text-sm">
          <span className="mb-1 block text-xs uppercase tracking-widest text-zinc-500">
            Track trend history
          </span>
          <label className="flex h-11 items-center justify-between gap-3 rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-3 text-sm text-zinc-100">
            <span className="text-sm text-zinc-300">Save dashboard deltas</span>
            <input
              type="checkbox"
              checked={trackHistory}
              onChange={(event) => setTrackHistory(event.target.checked)}
              className="h-4 w-4 accent-amber-400"
            />
          </label>
        </div>

        <label className="text-sm">
          <span className="mb-1 block text-xs uppercase tracking-widest text-zinc-500">
            History retention
          </span>
          <select
            value={ttlDays}
            onChange={(event) => setTtlDays(event.target.value as TtlDaysMode)}
            className="h-11 w-full rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-3 text-zinc-100 outline-none transition-colors focus:border-amber-400"
          >
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="0">Never expire</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-amber-400 px-4 text-sm font-semibold text-[#0d0f12] transition-all duration-200 hover:bg-amber-300 hover:shadow-[0_4px_12px_rgba(251,191,36,0.3)]"
        >
          Save preferences
        </button>
        <button
          type="button"
          onClick={exportTrendHistory}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-4 text-sm font-semibold text-zinc-300 transition-all duration-200 hover:border-amber-400 hover:text-amber-300"
        >
          Export trend history
        </button>
        <label className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-3 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={signExport}
            onChange={(event) => setSignExport(event.target.checked)}
            className="h-4 w-4 accent-amber-400"
          />
          Sign export
        </label>
        {signExport && (
          <input
            type="password"
            value={exportPassphrase}
            onChange={(event) => setExportPassphrase(event.target.value)}
            placeholder="Export passphrase"
            className="h-10 rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-amber-400"
          />
        )}
        <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-4 text-sm font-semibold text-zinc-300 transition-all duration-200 hover:border-amber-400 hover:text-amber-300">
          Import trend history
          <input
            type="file"
            accept="application/json"
            onChange={(event) => void importTrendHistory(event)}
            className="hidden"
          />
        </label>
        <input
          type="password"
          value={importPassphrase}
          onChange={(event) => setImportPassphrase(event.target.value)}
          placeholder="Import passphrase (for signed files)"
          className="h-10 rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-amber-400"
        />
        <button
          type="button"
          onClick={resetTrendHistory}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-red-500/30 bg-[#1b1412] px-4 text-sm font-semibold text-rose-300 transition-all duration-200 hover:border-red-400 hover:text-rose-200"
        >
          Reset trend history
        </button>
        {resetBackup && (
          <button
            type="button"
            onClick={undoResetTrendHistory}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-4 text-sm font-semibold text-zinc-300 transition-all duration-200 hover:border-amber-400 hover:text-amber-300"
          >
            Undo reset
          </button>
        )}
        <button
          type="button"
          onClick={runRecomputeNow}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-4 text-sm font-semibold text-zinc-300 transition-all duration-200 hover:border-amber-400 hover:text-amber-300"
        >
          Recompute timeline now
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-[#1e2229] bg-[#0a0c0f] p-4">
        <p className="text-xs uppercase tracking-widest text-zinc-500">Trend History Health</p>
        <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-zinc-300 md:grid-cols-2">
          <p>Tracking: {trackHistory ? "Enabled" : "Disabled"}</p>
          <p>Users: {trendStats.userCount}</p>
          <p>Snapshots: {trendStats.entryCount}</p>
          <p>Newest: {formatDateTime(trendStats.newestAt)}</p>
          <p>Oldest: {formatDateTime(trendStats.oldestAt)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-[#1e2229] bg-[#0a0c0f] p-4">
        <p className="text-xs uppercase tracking-widest text-zinc-500">Timeline Defaults</p>
        <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs uppercase tracking-widest text-zinc-500">Default window</span>
            <select
              value={timelineWindow}
              onChange={(event) => setTimelineWindow(event.target.value as TimelineWindowMode)}
              className="h-10 w-full rounded-lg border border-[#2a2f37] bg-[#111318] px-3 text-zinc-100 outline-none transition-colors focus:border-amber-400"
            >
              <option value="24h">24h</option>
              <option value="7d">7d</option>
              <option value="30d">30d</option>
              <option value="all">all</option>
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-xs uppercase tracking-widest text-zinc-500">Default delta mode</span>
            <select
              value={timelineDeltaMode}
              onChange={(event) => setTimelineDeltaMode(event.target.value as TimelineDeltaMode)}
              className="h-10 w-full rounded-lg border border-[#2a2f37] bg-[#111318] px-3 text-zinc-100 outline-none transition-colors focus:border-amber-400"
            >
              <option value="absolute">Absolute</option>
              <option value="percent">Percent</option>
            </select>
          </label>

          <div className="text-sm">
            <span className="mb-1 block text-xs uppercase tracking-widest text-zinc-500">Visible metrics</span>
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-[#2a2f37] bg-[#111318] p-2 text-xs text-zinc-300">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={showTimelinePushes}
                  onChange={(event) => setShowTimelinePushes(event.target.checked)}
                  className="h-3.5 w-3.5 accent-amber-400"
                />
                Pushes
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={showTimelineStars}
                  onChange={(event) => setShowTimelineStars(event.target.checked)}
                  className="h-3.5 w-3.5 accent-amber-400"
                />
                Stars
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={showTimelineRepos}
                  onChange={(event) => setShowTimelineRepos(event.target.checked)}
                  className="h-3.5 w-3.5 accent-amber-400"
                />
                Repos
              </label>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={resetTimelineViewPrefs}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#2a2f37] bg-[#111318] px-4 text-sm font-semibold text-zinc-300 transition-all duration-200 hover:border-amber-400 hover:text-amber-300"
          >
            Reset timeline view defaults
          </button>
        </div>
      </div>

      {pendingImport && (
        <div className="mt-4 rounded-xl border border-[#1e2229] bg-[#0a0c0f] p-4">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Import Preview</p>
          <p className="mt-2 text-sm text-zinc-300">File: {pendingImport.sourceFileName}</p>
          <p className="mt-1 text-xs text-zinc-500">
            Source version: v{pendingImport.sourceVersion}
            {pendingImport.checksumVerified ? " (checksum verified)" : " (legacy format)"}
            {pendingImport.signatureRequired
              ? pendingImport.signatureVerified
                ? " + signature verified"
                : " + signature missing"
              : ""}
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            {Object.keys(pendingImport.entries).length} entries for {pendingImport.usernames.length} user
            {pendingImport.usernames.length === 1 ? "" : "s"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Skipped invalid entries: {pendingImport.skippedCount}</p>
          <p className="mt-1 text-xs text-zinc-500">
            Users: {pendingImport.usernames.slice(0, 5).join(", ")}
            {pendingImport.usernames.length > 5 ? ` +${pendingImport.usernames.length - 5} more` : ""}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Dry run: {previewNewCount} new, {previewOverwriteCount} overwrite
            {importMode === "replace" ? " (replace mode clears existing first)" : ""}
          </p>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto]">
            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-widest text-zinc-500">Import mode</span>
              <select
                value={importMode}
                onChange={(event) => setImportMode(event.target.value as ImportMode)}
                className="h-10 w-full rounded-lg border border-[#2a2f37] bg-[#111318] px-3 text-zinc-100 outline-none transition-colors focus:border-amber-400"
              >
                <option value="merge">Merge with existing data</option>
                <option value="replace">Replace existing data</option>
              </select>
            </label>

            <button
              type="button"
              onClick={applyPendingImport}
              className="inline-flex h-10 self-end items-center justify-center rounded-lg bg-amber-400 px-4 text-sm font-semibold text-[#0d0f12] transition-all duration-200 hover:bg-amber-300"
            >
              Apply import
            </button>

            <button
              type="button"
              onClick={() => setPendingImport(null)}
              className="inline-flex h-10 self-end items-center justify-center rounded-lg border border-[#2a2f37] bg-[#111318] px-4 text-sm font-semibold text-zinc-300 transition-all duration-200 hover:border-amber-400 hover:text-amber-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}