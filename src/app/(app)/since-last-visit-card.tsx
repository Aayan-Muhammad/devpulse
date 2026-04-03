"use client";

import { useEffect, useMemo, useState } from "react";

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

const LAST_VISIT_PREFIX = "devpulse-last-visit";

function deltaLabel(value: number) {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

function deltaArrow(value: number) {
  if (value > 0) return "↑";
  if (value < 0) return "↓";
  return "→";
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
    const key = `${LAST_VISIT_PREFIX}:${username}`;

    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as Snapshot;
        if (
          typeof parsed.pushesLast7Days === "number" &&
          typeof parsed.activeReposLast30Days === "number" &&
          typeof parsed.totalStars === "number" &&
          typeof parsed.repoCount === "number" &&
          typeof parsed.topLanguageShare === "number" &&
          typeof parsed.topLanguageName === "string" &&
          typeof parsed.savedAt === "number"
        ) {
          setPrevious(parsed);
        }
      }

      window.localStorage.setItem(key, JSON.stringify(currentSnapshot));
    } catch {
      // Ignore storage exceptions so dashboard rendering never breaks.
    }
  }, [currentSnapshot, username]);

  if (!previous) {
    return (
      <div className="dp-card-lift dp-reveal dp-reveal-delay-3 rounded-xl border border-[#1e2229] bg-[#111318] p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Since Last Visit</p>
        <p className="mt-2 text-lg font-semibold text-zinc-100">Baseline captured</p>
        <p className="mt-1 text-sm text-zinc-400">
          Visit again to see how pushes, repos, stars, and language focus changed.
        </p>
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
    <div className="dp-card-lift dp-reveal dp-reveal-delay-3 rounded-xl border border-[#1e2229] bg-[#111318] p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Since Last Visit</p>
      <p className="mt-2 text-sm text-zinc-400">Compared with {hoursSince}h ago</p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-lg border border-[#1e2229] bg-[#0a0c0f] p-3">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Pushes (7d)</p>
          <p className={`mt-1 text-lg font-semibold ${pushDelta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {deltaArrow(pushDelta)} {deltaLabel(pushDelta)}
          </p>
        </div>
        <div className="rounded-lg border border-[#1e2229] bg-[#0a0c0f] p-3">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Active Repos</p>
          <p className={`mt-1 text-lg font-semibold ${activeReposDelta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {deltaArrow(activeReposDelta)} {deltaLabel(activeReposDelta)}
          </p>
        </div>
        <div className="rounded-lg border border-[#1e2229] bg-[#0a0c0f] p-3">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Total Stars</p>
          <p className={`mt-1 text-lg font-semibold ${starsDelta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {deltaArrow(starsDelta)} {deltaLabel(starsDelta)}
          </p>
        </div>
        <div className="rounded-lg border border-[#1e2229] bg-[#0a0c0f] p-3">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Repository Count</p>
          <p className={`mt-1 text-lg font-semibold ${repoCountDelta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {deltaArrow(repoCountDelta)} {deltaLabel(repoCountDelta)}
          </p>
        </div>
        <div className="rounded-lg border border-[#1e2229] bg-[#0a0c0f] p-3">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Top Language Focus</p>
          <p className={`mt-1 text-lg font-semibold ${topLanguageShareDelta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {deltaArrow(topLanguageShareDelta)} {topLanguageShareDelta > 0 ? "+" : ""}
            {topLanguageShareDelta.toFixed(1)}%
          </p>
          <p className="mt-1 text-xs text-zinc-500">Now {topLanguageName || "N/A"}</p>
        </div>
      </div>
    </div>
  );
}
