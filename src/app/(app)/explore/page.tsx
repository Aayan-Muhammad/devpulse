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
};

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<SearchResponse | null>(null);

  const totalPages = result ? Math.max(1, Math.ceil(result.totalCount / result.perPage)) : 1;

  const fetchResults = async (searchQuery: string, nextPage: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/github/search?query=${encodeURIComponent(searchQuery)}&page=${nextPage}`,
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
                </div>

                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <button
                    type="button"
                    onClick={() => goToPage(Math.max(1, page - 1))}
                    disabled={loading || page <= 1}
                    className="rounded-lg border border-[#1e2229] bg-[#0a0c0f] px-3 py-2 font-semibold text-zinc-200 transition-colors hover:border-amber-400 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="rounded-lg border border-[#1e2229] bg-[#0a0c0f] px-3 py-2 font-semibold text-zinc-200 transition-colors hover:border-amber-400 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {result.items.map((user) => (
                <article
                  key={user.id}
                  className="rounded-xl border border-[#1e2229] bg-[#111318] p-5 transition-colors hover:border-[#2f353f]"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={user.avatar_url}
                      alt={user.login}
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-semibold text-zinc-100">
                        {user.login}
                      </h3>
                      <p className="text-sm text-zinc-400">{user.type}</p>
                      <p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">
                        Score {user.score.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <Link
                      href={`/u/${encodeURIComponent(user.login)}`}
                      className="rounded-lg border border-[#1e2229] bg-[#0a0c0f] px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-amber-400 hover:text-amber-300"
                    >
                      View profile
                    </Link>
                    <a
                      href={user.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-amber-400 transition-colors hover:text-amber-300"
                    >
                      GitHub
                    </a>
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