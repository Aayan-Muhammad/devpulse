"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import type { GitHubUser } from "@/types/github";

type SearchResult = {
  user: GitHubUser;
  totalStars: number;
};

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const username = query.trim();
    if (!username) {
      setError("Enter a GitHub username to search.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/github/user?username=${encodeURIComponent(username)}`,
        { method: "GET" }
      );

      const payload = (await response.json()) as {
        user?: GitHubUser;
        totalStars?: number;
        error?: string;
      };

      if (!response.ok || !payload.user) {
        throw new Error(payload.error ?? "Unable to load GitHub profile.");
      }

      setResult({ user: payload.user, totalStars: payload.totalStars ?? 0 });
    } catch (searchError) {
      const message = searchError instanceof Error ? searchError.message : "";
      const notFound =
        message.toLowerCase().includes("could not find") || message.includes("404");

      setResult(null);
      setError(
        notFound
          ? `Could not find a GitHub user named @${username}.`
          : "Could not load that profile right now. Please try again in a moment."
      );
    } finally {
      setLoading(false);
    }
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
          <div className="rounded-xl border border-[#1e2229] bg-[#111318] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={result.user.avatar_url}
                  alt={result.user.login}
                  width={72}
                  height={72}
                  className="h-[72px] w-[72px] rounded-full object-cover"
                />
                <div>
                  <h2 className="text-2xl font-semibold text-zinc-100">
                    {result.user.name || result.user.login}
                  </h2>
                  <p className="text-sm text-zinc-400">@{result.user.login}</p>
                  {result.user.bio && (
                    <p className="mt-1 max-w-xl text-sm text-zinc-300">{result.user.bio}</p>
                  )}
                </div>
              </div>

              <Link
                href={`/u/${encodeURIComponent(result.user.login)}`}
                className="rounded-lg border border-[#1e2229] bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-black transition-colors hover:bg-amber-300"
              >
                View full profile
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-[#1e2229] bg-[#0a0c0f] p-4">
                <p className="text-xs uppercase tracking-widest text-zinc-500">Followers</p>
                <p className="mt-1 text-2xl font-bold text-zinc-100">
                  {result.user.followers}
                </p>
              </div>
              <div className="rounded-lg border border-[#1e2229] bg-[#0a0c0f] p-4">
                <p className="text-xs uppercase tracking-widest text-zinc-500">Public Repos</p>
                <p className="mt-1 text-2xl font-bold text-zinc-100">
                  {result.user.public_repos}
                </p>
              </div>
              <div className="rounded-lg border border-[#1e2229] bg-[#0a0c0f] p-4">
                <p className="text-xs uppercase tracking-widest text-zinc-500">Total Stars</p>
                <p className="mt-1 text-2xl font-bold text-zinc-100">{result.totalStars}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}