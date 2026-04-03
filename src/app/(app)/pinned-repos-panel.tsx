"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PINNED_REPOS_KEY } from "@/lib/preferences";

type RepoPreview = {
  name: string;
  htmlUrl: string;
  stars: number;
};

type PinnedReposPanelProps = {
  repos: RepoPreview[];
};

export function PinnedReposPanel({ repos }: PinnedReposPanelProps) {
  const [pinnedNames, setPinnedNames] = useState<string[]>([]);

  useEffect(() => {
    const raw = window.localStorage.getItem(PINNED_REPOS_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setPinnedNames(parsed.filter((value): value is string => typeof value === "string"));
      }
    } catch {
      setPinnedNames([]);
    }
  }, []);

  const pinnedRepos = useMemo(() => {
    if (!pinnedNames.length) {
      return [] as RepoPreview[];
    }

    const map = new Map(repos.map((repo) => [repo.name, repo]));
    return pinnedNames.map((name) => map.get(name)).filter((repo): repo is RepoPreview => Boolean(repo));
  }, [repos, pinnedNames]);

  return (
    <section className="dp-surface dp-card-lift dp-reveal dp-reveal-delay-3 mb-8 rounded-xl p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Pinned repositories</p>
        <Link
          href="/settings"
          className="dp-control text-xs font-semibold text-zinc-400 hover:text-amber-300"
        >
          Manage in settings
        </Link>
      </div>

      {pinnedRepos.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {pinnedRepos.map((repo) => (
            <a
              key={repo.name}
              href={repo.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="dp-surface dp-control rounded-lg px-4 py-3 text-sm hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
            >
              <p className="truncate font-semibold text-zinc-100">{repo.name}</p>
              <p className="mt-1 text-xs text-zinc-500">★ {repo.stars}</p>
            </a>
          ))}
        </div>
      ) : (
        <div className="dp-surface rounded-lg p-4 text-sm text-zinc-400">
          No pinned repositories yet. Pick a few in Settings to keep them here.
        </div>
      )}
    </section>
  );
}