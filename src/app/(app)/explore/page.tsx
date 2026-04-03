"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import type { GitHubSearchUser } from "@/types/github";

type SearchResponse = {
  query: string;
  page: number;
  perPage: number;
  totalCount: number;
  items: GitHubSearchUser[];
  filters?: {
    sort: string;
    type: string;
    minFollowers: number;
  };
  enrichment?: {
    isPartial: boolean;
    enrichedCount: number;
    totalItems: number;
    rateLimitRemaining: number | null;
    rateLimitResetAt: number | null;
  };
};

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("best");
  const [accountType, setAccountType] = useState("all");
  const [minFollowers, setMinFollowers] = useState("0");
  const [result, setResult] = useState<SearchResponse | null>(null);

  const totalPages = result ? Math.max(1, Math.ceil(result.totalCount / result.perPage)) : 1;

  const fetchResults = async (searchQuery: string, nextPage: number) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        query: searchQuery,
        page: String(nextPage),
        sort: sortBy,
        type: accountType,
        minFollowers,
      });

      const response = await fetch(
        `/api/github/search?${params.toString()}`,
        { method: "GET" }
      );

      const payload = (await response.json()) as SearchResponse & { error?: string };

      if (!response.ok || !payload.items) {
        throw new Error(payload.error ?? "Unable to search GitHub users.");
      }

      setResult(payload);
      setPage(payload.page);
    } catch (searchError) {
      const message = searchError instanceof Error ? searchError.message : "";
      const notFound = message.toLowerCase().includes("could not find") || message.includes("404");

      setResult(null);
      setError(
        notFound
          ? `Could not find any GitHub users matching "${searchQuery}".`
          : "Could not load search results right now. Please try again in a moment."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const searchQuery = query.trim();
    if (!searchQuery) {
      setError("Enter a name or username to search.");
      setResult(null);
      return;
    }

    setPage(1);
    await fetchResults(searchQuery, 1);
  };

  const goToPage = async (nextPage: number) => {
    if (!query.trim() || loading) {
      return;
    }

    await fetchResults(query.trim(), nextPage);
  };

  return (
    <div className="min-h-screen bg-[#0d0f12] p-6 text-zinc-200">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-center text-4xl font-semibold text-zinc-100">
          Explore GitHub Users
        </h1>

        <form
          onSubmit={handleSearch}
          className="mb-8 rounded-xl border border-[#1e2229] bg-[#111318] p-5"
        >
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by GitHub username..."
              aria-label="Search GitHub users"
              className="h-14 w-full rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-5 text-lg text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-14 w-full rounded-lg bg-amber-400 px-6 text-sm font-bold text-[#0d0f12] transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-widest text-zinc-500">Sort</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                aria-label="Sort search results"
                className="h-11 w-full rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-3 text-zinc-100 outline-none transition-colors focus:border-amber-400"
              >
                <option value="best">Best match</option>
                <option value="followers">Most followers</option>
                <option value="repositories">Most repositories</option>
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-widest text-zinc-500">Type</span>
              <select
                value={accountType}
                onChange={(event) => setAccountType(event.target.value)}
                aria-label="Filter account type"
                className="h-11 w-full rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-3 text-zinc-100 outline-none transition-colors focus:border-amber-400"
              >
                <option value="all">All</option>
                <option value="user">Users only</option>
                <option value="org">Organizations only</option>
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-widest text-zinc-500">
                Min followers
              </span>
              <input
                type="number"
                min={0}
                value={minFollowers}
                onChange={(event) => setMinFollowers(event.target.value)}
                aria-label="Minimum followers"
                className="h-11 w-full rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-3 text-zinc-100 outline-none transition-colors focus:border-amber-400"
              />
            </label>
          </div>
        </form>

        {error && (
          <div className="mb-8 rounded-xl border border-[#3b2620] bg-[#1b1412] p-4 text-center text-sm text-amber-300">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#1e2229] bg-[#111318] p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-zinc-500">Results</p>
                  <h2 className="mt-1 text-2xl font-semibold text-zinc-100">
                    {result.totalCount} people matching “{result.query}”
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Showing page {result.page} of {totalPages}, 15 at a time
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Sort: {result.filters?.sort ?? sortBy} | Type: {result.filters?.type ?? accountType}
                    {` | Min followers: ${result.filters?.minFollowers ?? Number(minFollowers || 0)}`}
                  </p>
                  {result.enrichment?.isPartial && (
                    <p className="mt-2 text-xs text-amber-300">
                      Showing full metrics for {result.enrichment.enrichedCount} of {result.enrichment.totalItems} results to keep search fast.
                    </p>
                  )}
                  {typeof result.enrichment?.rateLimitRemaining === "number" &&
                    result.enrichment.rateLimitRemaining < 20 && (
                      <p className="mt-1 text-xs text-rose-300">
                        GitHub rate limit is low ({result.enrichment.rateLimitRemaining} remaining). Some details may be limited temporarily.
                      </p>
                    )}
                </div>

                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <button
                    type="button"
                    onClick={() => goToPage(Math.max(1, page - 1))}
                    disabled={loading || page <= 1}
                    aria-label="Go to previous page"
                    className="rounded-lg border border-[#1e2229] bg-[#0a0c0f] px-3 py-2 font-semibold text-zinc-200 transition-all duration-200 hover:border-amber-400 hover:text-amber-300 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="min-w-20 text-center text-zinc-500">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => goToPage(Math.min(totalPages, page + 1))}
                    disabled={loading || page >= totalPages}
                    aria-label="Go to next page"
                    className="rounded-lg border border-[#1e2229] bg-[#0a0c0f] px-3 py-2 font-semibold text-zinc-200 transition-all duration-200 hover:border-amber-400 hover:text-amber-300 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {result.items.map((user) => (
                <article
                  key={user.id}
                  className="rounded-xl border border-[#1e2229] bg-[#111318] p-5 transition-colors hover:border-[#2f353f]"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-4">
                        <img
                          src={user.avatar_url}
                          alt={user.login}
                          width={64}
                          height={64}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <h3 className="truncate text-xl font-semibold text-zinc-100">
                            {user.name || user.login}
                          </h3>
                          <p className="text-sm text-zinc-400">@{user.login}</p>
                        </div>
                      </div>

                      {user.bio && (
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-300">{user.bio}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:w-[420px]">
                      <div className="rounded-lg border border-[#1e2229] bg-[#0a0c0f] p-3">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">Followers</p>
                        <p className="mt-1 text-lg font-bold text-zinc-100">{user.followers ?? "-"}</p>
                      </div>
                      <div className="rounded-lg border border-[#1e2229] bg-[#0a0c0f] p-3">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">Public Repos</p>
                        <p className="mt-1 text-lg font-bold text-zinc-100">{user.public_repos ?? "-"}</p>
                      </div>
                      <div className="rounded-lg border border-[#1e2229] bg-[#0a0c0f] p-3">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">Total Stars</p>
                        <p className="mt-1 text-lg font-bold text-zinc-100">{user.totalStars ?? "-"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 lg:w-[210px] lg:justify-end">
                      <Link
                        href={`/u/${encodeURIComponent(user.login)}`}
                        className="rounded-lg border border-[#1e2229] bg-[#0a0c0f] px-4 py-2 text-sm font-semibold text-zinc-200 transition-all duration-200 hover:border-amber-400 hover:text-amber-300 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
                      >
                        View profile
                      </Link>
                      <a
                        href={user.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-[#1e2229] px-4 py-2 text-sm font-semibold text-amber-400 transition-colors hover:border-amber-400 hover:text-amber-300"
                      >
                        GitHub
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}