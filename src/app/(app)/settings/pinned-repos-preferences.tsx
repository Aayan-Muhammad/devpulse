"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PINNED_REPOS_KEY } from "@/lib/preferences";

type RepoOption = {
  name: string;
  htmlUrl: string;
  stars: number;
};

type PinnedReposPreferencesProps = {
  repos: RepoOption[];
  initialPinned: string[];
};

export function PinnedReposPreferences({ repos, initialPinned }: PinnedReposPreferencesProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>(initialPinned);

  useEffect(() => {
    const raw = window.localStorage.getItem(PINNED_REPOS_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setSelected(parsed.filter((value): value is string => typeof value === "string"));
      }
    } catch {
      setSelected(initialPinned);
    }
  }, [initialPinned]);

  const filteredRepos = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return repos.slice(0, 30);
    }

    return repos
      .filter((repo) => repo.name.toLowerCase().includes(q))
      .slice(0, 30);
  }, [repos, query]);

  const toggleRepo = (name: string) => {
    setSelected((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name]
    );
  };

  const save = () => {
    window.localStorage.setItem(PINNED_REPOS_KEY, JSON.stringify(selected));
    toast.success("Pinned repositories updated.");
  };

  const clear = () => {
    setSelected([]);
    window.localStorage.setItem(PINNED_REPOS_KEY, JSON.stringify([]));
    toast.success("Pinned repositories cleared.");
  };

  return (
    <section className="dp-reveal [animation-delay:220ms] rounded-xl border border-[#1e2229] bg-[#111318] p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-zinc-100">Pinned Repositories</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Pick repositories to keep at the top of your dashboard.
        </p>
      </div>

      <label className="mb-4 block text-sm">
        <span className="mb-1 block text-xs uppercase tracking-widest text-zinc-500">Search repository</span>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="repo name"
          className="h-11 w-full rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-3 text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-amber-400"
        />
      </label>

      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {filteredRepos.map((repo) => {
          const isSelected = selected.includes(repo.name);

          return (
            <label
              key={repo.name}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#1e2229] bg-[#0a0c0f] px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-100">{repo.name}</p>
                <p className="text-xs text-zinc-500">★ {repo.stars}</p>
              </div>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleRepo(repo.name)}
                className="h-4 w-4 accent-amber-400"
              />
            </label>
          );
        })}

        {filteredRepos.length === 0 ? (
          <div className="rounded-lg border border-[#1e2229] bg-[#0a0c0f] p-4 text-sm text-zinc-500">
            No repositories match your search.
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={save}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-amber-400 px-4 text-sm font-semibold text-[#0d0f12] transition-all duration-200 hover:bg-amber-300 hover:shadow-[0_4px_12px_rgba(251,191,36,0.3)]"
        >
          Save pinned repos
        </button>
        <button
          type="button"
          onClick={clear}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-4 text-sm font-semibold text-zinc-200 transition-all duration-200 hover:border-amber-400 hover:text-amber-300 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
        >
          Clear
        </button>
      </div>
    </section>
  );
}