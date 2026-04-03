"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LAST_VISIT_HISTORY_PREFIX,
  LAST_VISIT_PREFIX,
  TREND_TIMELINE_DELTA_MODE_KEY,
  TREND_HISTORY_UPDATED_EVENT,
  TREND_HISTORY_ENABLED_KEY,
  TREND_HISTORY_TTL_DAYS_KEY,
  TREND_TIMELINE_SHOW_PUSHES_KEY,
  TREND_TIMELINE_SHOW_REPOS_KEY,
  TREND_TIMELINE_SHOW_STARS_KEY,
  TREND_TIMELINE_WINDOW_KEY,
} from "@/lib/preferences";
import {
  classifyTimelineConfidence,
  formatTimelineDelta,
  type TimelineDeltaMode,
} from "@/lib/timeline-analysis";

type Snapshot = {
  pushesLast7Days: number;
  activeReposLast30Days: number;
  totalStars: number;
  repoCount: number;
  topLanguageShare: number;
  topLanguageName: string;
  savedAt: number;
};

type SinceLastVisitCardProps = {
  username: string;
  pushesLast7Days: number;
  activeReposLast30Days: number;
  totalStars: number;
  repoCount: number;
  topLanguageShare: number;
  topLanguageName: string;
};

const MAX_HISTORY_ITEMS = 6;
const DEFAULT_HISTORY_TTL_DAYS = 30;

type SnapshotDelta = {
  id: string;
  label: string;
  pushDelta: number;
  starsDelta: number;
  repoDelta: number;
  pushSeries: number[];
  starsSeries: number[];
  repoSeries: number[];
};

type TimelineWindow = "24h" | "7d" | "30d" | "all";
const TIMELINE_WINDOW_MS: Record<Exclude<TimelineWindow, "all">, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

function Sparkline({ points, positive }: { points: number[]; positive: boolean }) {
  const width = 56;
  const height = 16;

  if (points.length < 2) {
    return <span className="inline-block h-4 w-14 rounded bg-zinc-900/80" />;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(1, max - min);

  const polylinePoints = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point - min) / range) * (height - 2) - 1;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline
        fill="none"
        stroke={positive ? "#6ee7b7" : "#fda4af"}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polylinePoints}
      />
    </svg>
  );
}

function deltaArrow(value: number) {
  if (value > 0) return "↑";
  if (value < 0) return "↓";
  return "→";
}

function getHistoryTtlMs(rawValue: string | null): number {
  if (rawValue === "0") {
    return Number.POSITIVE_INFINITY;
  }

  const parsedDays = Number(rawValue);
  const days = Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : DEFAULT_HISTORY_TTL_DAYS;
  return days * 24 * 60 * 60 * 1000;
}

export function SinceLastVisitCard({
  username,
  pushesLast7Days,
  activeReposLast30Days,
  totalStars,
  repoCount,
  topLanguageShare,
  topLanguageName,
}: SinceLastVisitCardProps) {
  const [previous, setPrevious] = useState<Snapshot | null>(null);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [historyTrackingEnabled, setHistoryTrackingEnabled] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);
  const [timelineWindow, setTimelineWindow] = useState<TimelineWindow>("7d");
  const [deltaMode, setDeltaMode] = useState<TimelineDeltaMode>("absolute");
  const [showPushes, setShowPushes] = useState(true);
  const [showStars, setShowStars] = useState(true);
  const [showRepos, setShowRepos] = useState(true);
  const [lastRecomputedAt, setLastRecomputedAt] = useState<number | null>(null);

  const currentSnapshot = useMemo<Snapshot>(
    () => ({
      pushesLast7Days,
      activeReposLast30Days,
      totalStars,
      repoCount,
      topLanguageShare,
      topLanguageName,
      savedAt: Date.now(),
    }),
    [
      pushesLast7Days,
      activeReposLast30Days,
      totalStars,
      repoCount,
      topLanguageShare,
      topLanguageName,
    ]
  );

  useEffect(() => {
    try {
      const savedWindow = window.localStorage.getItem(TREND_TIMELINE_WINDOW_KEY);
      const savedShowPushes = window.localStorage.getItem(TREND_TIMELINE_SHOW_PUSHES_KEY);
      const savedShowStars = window.localStorage.getItem(TREND_TIMELINE_SHOW_STARS_KEY);
      const savedShowRepos = window.localStorage.getItem(TREND_TIMELINE_SHOW_REPOS_KEY);
      const savedDeltaMode = window.localStorage.getItem(TREND_TIMELINE_DELTA_MODE_KEY);
      const savedRecompute = window.localStorage.getItem(TREND_HISTORY_UPDATED_EVENT);

      if (savedWindow === "24h" || savedWindow === "7d" || savedWindow === "30d" || savedWindow === "all") {
        setTimelineWindow(savedWindow);
      }

      if (savedShowPushes === "true" || savedShowPushes === "false") {
        setShowPushes(savedShowPushes === "true");
      }

      if (savedShowStars === "true" || savedShowStars === "false") {
        setShowStars(savedShowStars === "true");
      }

      if (savedShowRepos === "true" || savedShowRepos === "false") {
        setShowRepos(savedShowRepos === "true");
      }

      if (savedDeltaMode === "absolute" || savedDeltaMode === "percent") {
        setDeltaMode(savedDeltaMode);
      }

      if (savedRecompute && /^\d+$/.test(savedRecompute)) {
        setLastRecomputedAt(Number(savedRecompute));
      }
    } catch {
      // Ignore storage exceptions so dashboard rendering never breaks.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(TREND_TIMELINE_WINDOW_KEY, timelineWindow);
      window.localStorage.setItem(TREND_TIMELINE_SHOW_PUSHES_KEY, String(showPushes));
      window.localStorage.setItem(TREND_TIMELINE_SHOW_STARS_KEY, String(showStars));
      window.localStorage.setItem(TREND_TIMELINE_SHOW_REPOS_KEY, String(showRepos));
      window.localStorage.setItem(TREND_TIMELINE_DELTA_MODE_KEY, deltaMode);
    } catch {
      // Ignore storage exceptions so dashboard rendering never breaks.
    }
  }, [timelineWindow, showPushes, showStars, showRepos, deltaMode]);

  useEffect(() => {
    const key = `${LAST_VISIT_PREFIX}:${username}`;
    const historyKey = `${LAST_VISIT_HISTORY_PREFIX}:${username}`;

    const isValidSnapshot = (value: unknown): value is Snapshot => {
      const parsed = value as Snapshot;
      return (
        typeof parsed?.pushesLast7Days === "number" &&
        typeof parsed?.activeReposLast30Days === "number" &&
        typeof parsed?.totalStars === "number" &&
        typeof parsed?.repoCount === "number" &&
        typeof parsed?.topLanguageShare === "number" &&
        typeof parsed?.topLanguageName === "string" &&
        typeof parsed?.savedAt === "number"
      );
    };

    try {
      const trackingPreference = window.localStorage.getItem(TREND_HISTORY_ENABLED_KEY);
      const isEnabled = trackingPreference !== "false";
      setHistoryTrackingEnabled(isEnabled);
      const ttlMs = getHistoryTtlMs(window.localStorage.getItem(TREND_HISTORY_TTL_DAYS_KEY));

      if (!isEnabled) {
        setPrevious(null);
        setHistory([]);
        window.localStorage.removeItem(key);
        window.localStorage.removeItem(historyKey);
        return;
      }

      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as Snapshot;
        if (isValidSnapshot(parsed)) {
          setPrevious(parsed);
        }
      }

      const rawHistory = window.localStorage.getItem(historyKey);
      const parsedHistory = rawHistory ? (JSON.parse(rawHistory) as unknown[]) : [];
      const now = Date.now();
      const validHistory = parsedHistory
        .filter(isValidSnapshot)
        .filter((item) => now - item.savedAt <= ttlMs);

      const shouldAppendCurrent =
        validHistory.length === 0 || validHistory[validHistory.length - 1].savedAt !== currentSnapshot.savedAt;

      const nextHistory = [...validHistory, ...(shouldAppendCurrent ? [currentSnapshot] : [])]
        .sort((a, b) => a.savedAt - b.savedAt)
        .slice(-MAX_HISTORY_ITEMS);

      setHistory(nextHistory);

      window.localStorage.setItem(key, JSON.stringify(currentSnapshot));
      window.localStorage.setItem(historyKey, JSON.stringify(nextHistory));
    } catch {
      // Ignore storage exceptions so dashboard rendering never breaks.
    }
  }, [currentSnapshot, refreshTick, username]);

  useEffect(() => {
    const handleTrendUpdate = () => {
      setRefreshTick((value) => value + 1);
      setLastRecomputedAt(Date.now());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === TREND_HISTORY_UPDATED_EVENT) {
        handleTrendUpdate();
      }
    };

    window.addEventListener(TREND_HISTORY_UPDATED_EVENT, handleTrendUpdate);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(TREND_HISTORY_UPDATED_EVENT, handleTrendUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const scopedHistory = useMemo(() => {
    const now = Date.now();
    return timelineWindow === "all"
      ? history
      : history.filter((item) => now - item.savedAt <= TIMELINE_WINDOW_MS[timelineWindow]);
  }, [history, timelineWindow]);

  const timeline = useMemo<SnapshotDelta[]>(() => {
    if (scopedHistory.length < 2) {
      return [];
    }

    const deltas: SnapshotDelta[] = [];

    for (let index = 1; index < scopedHistory.length; index += 1) {
      const prev = scopedHistory[index - 1];
      const next = scopedHistory[index];
      const hoursAgo = Math.max(1, Math.round((Date.now() - next.savedAt) / (1000 * 60 * 60)));
      const label = hoursAgo < 48 ? `${hoursAgo}h ago` : `${Math.round(hoursAgo / 24)}d ago`;

      deltas.push({
        id: `${next.savedAt}-${index}`,
        label,
        pushDelta: next.pushesLast7Days - prev.pushesLast7Days,
        starsDelta: next.totalStars - prev.totalStars,
        repoDelta: next.repoCount - prev.repoCount,
        pushSeries: scopedHistory.slice(0, index + 1).map((item) => item.pushesLast7Days),
        starsSeries: scopedHistory.slice(0, index + 1).map((item) => item.totalStars),
        repoSeries: scopedHistory.slice(0, index + 1).map((item) => item.repoCount),
      });
    }

    return deltas.slice(-4).reverse();
  }, [scopedHistory]);

  const confidenceLevel = classifyTimelineConfidence(scopedHistory.length);
  const confidenceLabel =
    confidenceLevel === "high" ? "High confidence" : confidenceLevel === "medium" ? "Medium confidence" : "Low confidence";

  const confidenceClass =
    scopedHistory.length >= 5
      ? "text-emerald-300"
      : scopedHistory.length >= 3
        ? "text-amber-300"
        : "text-rose-300";

  const formatDelta = (delta: number, previous: number) => formatTimelineDelta(delta, previous, deltaMode);

  if (!previous) {
    return (
      <div className="dp-surface dp-card-lift dp-reveal dp-reveal-delay-3 rounded-xl p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Since Last Visit</p>
        {historyTrackingEnabled ? (
          <>
            <p className="mt-2 text-lg font-semibold text-zinc-100">Baseline captured</p>
            <p className="mt-1 text-sm text-zinc-400">
              Visit again to see how pushes, repos, stars, and language focus changed.
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 text-lg font-semibold text-zinc-100">Trend history is disabled</p>
            <p className="mt-1 text-sm text-zinc-400">
              Enable "Track trend history" in Settings to save and compare snapshots on this device.
            </p>
          </>
        )}
      </div>
    );
  }

  const hoursSince = Math.max(1, Math.round((Date.now() - previous.savedAt) / (1000 * 60 * 60)));
  const pushDelta = pushesLast7Days - previous.pushesLast7Days;
  const activeReposDelta = activeReposLast30Days - previous.activeReposLast30Days;
  const starsDelta = totalStars - previous.totalStars;
  const repoCountDelta = repoCount - previous.repoCount;
  const topLanguageShareDelta = topLanguageShare - previous.topLanguageShare;

  return (
    <div className="dp-surface dp-card-lift dp-reveal dp-reveal-delay-3 rounded-xl p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Since Last Visit</p>
      <p className="mt-2 text-sm text-zinc-400">Compared with {hoursSince}h ago</p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="dp-surface rounded-lg p-3">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Pushes (7d)</p>
          <p className={`mt-1 text-lg font-semibold ${pushDelta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {deltaArrow(pushDelta)} {formatDelta(pushDelta, previous.pushesLast7Days)}
          </p>
        </div>
        <div className="dp-surface rounded-lg p-3">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Active Repos</p>
          <p className={`mt-1 text-lg font-semibold ${activeReposDelta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {deltaArrow(activeReposDelta)} {formatDelta(activeReposDelta, previous.activeReposLast30Days)}
          </p>
        </div>
        <div className="dp-surface rounded-lg p-3">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Total Stars</p>
          <p className={`mt-1 text-lg font-semibold ${starsDelta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {deltaArrow(starsDelta)} {formatDelta(starsDelta, previous.totalStars)}
          </p>
        </div>
        <div className="dp-surface rounded-lg p-3">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Repository Count</p>
          <p className={`mt-1 text-lg font-semibold ${repoCountDelta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {deltaArrow(repoCountDelta)} {formatDelta(repoCountDelta, previous.repoCount)}
          </p>
        </div>
        <div className="dp-surface rounded-lg p-3">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Top Language Focus</p>
          <p className={`mt-1 text-lg font-semibold ${topLanguageShareDelta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {deltaArrow(topLanguageShareDelta)} {topLanguageShareDelta > 0 ? "+" : ""}
            {topLanguageShareDelta.toFixed(1)}%
          </p>
          <p className="mt-1 text-xs text-zinc-500">Now {topLanguageName || "N/A"}</p>
        </div>
      </div>

      {history.length > 1 && (
        <div className="mt-4 dp-surface rounded-lg p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-500">Recent Change Timeline</p>
              <p className={`mt-1 text-[11px] ${confidenceClass}`}>{confidenceLabel}</p>
              {lastRecomputedAt && (
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  Last recompute: {new Date(lastRecomputedAt).toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-[#1e2229] bg-[#111318]/90 p-1">
                {(["24h", "7d", "30d", "all"] as TimelineWindow[]).map((windowValue) => (
                  <button
                    key={windowValue}
                    type="button"
                    onClick={() => setTimelineWindow(windowValue)}
                    className={`rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                      timelineWindow === windowValue
                        ? "bg-amber-400 text-[#0d0f12]"
                        : "text-zinc-400 hover:text-amber-300"
                    }`}
                  >
                    {windowValue}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 rounded-lg border border-[#1e2229] bg-[#111318]/90 p-1">
                <button
                  type="button"
                  onClick={() => setDeltaMode("absolute")}
                  className={`rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                    deltaMode === "absolute"
                      ? "bg-amber-400 text-[#0d0f12]"
                      : "text-zinc-400 hover:text-amber-300"
                  }`}
                >
                  Abs
                </button>
                <button
                  type="button"
                  onClick={() => setDeltaMode("percent")}
                  className={`rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                    deltaMode === "percent"
                      ? "bg-amber-400 text-[#0d0f12]"
                      : "text-zinc-400 hover:text-amber-300"
                  }`}
                >
                  %
                </button>
              </div>

              <div className="flex items-center gap-1 rounded-lg border border-[#1e2229] bg-[#111318]/90 p-1">
                <button
                  type="button"
                  onClick={() => setShowPushes((value) => !value)}
                  className={`rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                    showPushes ? "bg-emerald-500/20 text-emerald-300" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Pushes
                </button>
                <button
                  type="button"
                  onClick={() => setShowStars((value) => !value)}
                  className={`rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                    showStars ? "bg-emerald-500/20 text-emerald-300" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Stars
                </button>
                <button
                  type="button"
                  onClick={() => setShowRepos((value) => !value)}
                  className={`rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                    showRepos ? "bg-emerald-500/20 text-emerald-300" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Repos
                </button>
              </div>
            </div>
          </div>
          {timeline.length === 0 ? (
            <p className="mt-2 text-xs text-zinc-500">No checkpoints in this time window. Try a wider range.</p>
          ) : !showPushes && !showStars && !showRepos ? (
            <p className="mt-2 text-xs text-zinc-500">Enable at least one metric toggle to view timeline rows.</p>
          ) : (
            <div className="mt-2 space-y-1.5">
              {timeline.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                  <span>{entry.label}</span>
                  {showPushes && (
                    <>
                      <span className="text-zinc-500">Pushes</span>
                      <span className={entry.pushDelta >= 0 ? "text-emerald-300" : "text-rose-300"}>
                        {deltaArrow(entry.pushDelta)} {formatDelta(entry.pushDelta, entry.pushSeries[entry.pushSeries.length - 2] ?? 0)}
                      </span>
                      <Sparkline points={entry.pushSeries} positive={entry.pushDelta >= 0} />
                    </>
                  )}
                  {showStars && (
                    <>
                      <span className="text-zinc-500">Stars</span>
                      <span className={entry.starsDelta >= 0 ? "text-emerald-300" : "text-rose-300"}>
                        {deltaArrow(entry.starsDelta)} {formatDelta(entry.starsDelta, entry.starsSeries[entry.starsSeries.length - 2] ?? 0)}
                      </span>
                      <Sparkline points={entry.starsSeries} positive={entry.starsDelta >= 0} />
                    </>
                  )}
                  {showRepos && (
                    <>
                      <span className="text-zinc-500">Repos</span>
                      <span className={entry.repoDelta >= 0 ? "text-emerald-300" : "text-rose-300"}>
                        {deltaArrow(entry.repoDelta)} {formatDelta(entry.repoDelta, entry.repoSeries[entry.repoSeries.length - 2] ?? 0)}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
