"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ComparisonData = {
  user1: {
    login: string;
    name: string | null;
    avatar_url: string;
    bio: string | null;
    followers: number;
    following: number;
    public_repos: number;
    total_stars: number;
    total_forks: number;
    repos_updated_90d: number;
    top_languages: Array<{ lang: string; bytes: number }>;
  };
  user2: {
    login: string;
    name: string | null;
    avatar_url: string;
    bio: string | null;
    followers: number;
    following: number;
    public_repos: number;
    total_stars: number;
    total_forks: number;
    repos_updated_90d: number;
    top_languages: Array<{ lang: string; bytes: number }>;
  };
  comparison: {
    shared_languages: string[];
    only_user1_languages: string[];
    only_user2_languages: string[];
  };
};

function ComparisonStat({
  label,
  value1,
  value2,
  isHighBetter = true,
}: {
  label: string;
  value1: number;
  value2: number;
  isHighBetter?: boolean;
}) {
  const user1Advantage = isHighBetter ? value1 > value2 : value1 < value2;
  const user2Advantage = isHighBetter ? value2 > value1 : value2 < value1;

  return (
    <div className="dp-surface rounded-lg p-4 transition-all duration-200 hover:shadow-[0_4px_12px_rgba(251,191,36,0.12)]">
      <p className="text-xs uppercase tracking-widest text-zinc-500">{label}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className={`flex-1 text-center ${user1Advantage ? "text-amber-400" : "text-zinc-400"}`}>
          <p className="text-2xl font-bold">{value1}</p>
        </div>
        <div className="text-xs text-zinc-600">vs</div>
        <div className={`flex-1 text-center ${user2Advantage ? "text-amber-400" : "text-zinc-400"}`}>
          <p className="text-2xl font-bold">{value2}</p>
        </div>
      </div>
    </div>
  );
}

export default function CompareClient({ user1, user2 }: { user1: string; user2: string }) {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user1Decoded = decodeURIComponent(user1);
  const user2Decoded = decodeURIComponent(user2);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        const response = await fetch(
          `/api/github/compare?user1=${encodeURIComponent(user1Decoded)}&user2=${encodeURIComponent(user2Decoded)}`
        );

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          throw new Error(errorData.error || "Failed to fetch comparison");
        }

        const result = (await response.json()) as ComparisonData;
        setData(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [user1Decoded, user2Decoded]);

  if (loading) {
    return (
      <div className="dp-grid-bg min-h-screen bg-transparent p-6 text-zinc-200">
        <div className="mx-auto max-w-6xl rounded-xl p-8 text-center dp-surface">
          <p className="text-zinc-400">Loading comparison...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="dp-grid-bg min-h-screen bg-transparent p-6 text-zinc-200">
        <div className="mx-auto max-w-6xl">
          <Link href="/explore" className="dp-control mb-6 inline-flex rounded-lg border border-[#2a2f37] px-3 py-2 text-sm text-amber-300 transition-colors hover:border-amber-400 hover:text-amber-200">
            ← Back to Explore
          </Link>
          <div className="dp-surface rounded-xl p-8 text-center">
            <h1 className="text-xl font-semibold text-zinc-100">Comparison unavailable</h1>
            <p className="mt-2 text-sm text-zinc-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dp-grid-bg min-h-screen bg-transparent p-6 text-zinc-200">
      <div className="mx-auto max-w-6xl">
        <Link href="/explore" className="dp-control mb-6 inline-flex rounded-lg border border-[#2a2f37] px-3 py-2 text-sm text-amber-300 transition-colors hover:border-amber-400 hover:text-amber-200">
          ← Back to Explore
        </Link>

        <div className="dp-reveal [animation-delay:40ms] mb-8 text-center">
          <h1 className="text-4xl font-bold text-zinc-100">
            {data.user1.name || data.user1.login} vs {data.user2.name || data.user2.login}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            @{data.user1.login} • @{data.user2.login}
          </p>
        </div>

        <div className="dp-reveal [animation-delay:80ms] mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {[data.user1, data.user2].map((user) => (
            <div key={user.login} className="dp-surface dp-card-lift rounded-xl p-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <img
                  src={user.avatar_url}
                  alt={user.login}
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-2xl font-semibold text-zinc-100">{user.name || user.login}</h2>
                  <p className="mt-1 text-sm text-zinc-400">@{user.login}</p>
                  {user.bio && <p className="mt-2 text-sm text-zinc-300">{user.bio}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="dp-reveal [animation-delay:120ms] mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <ComparisonStat label="Followers" value1={data.user1.followers} value2={data.user2.followers} />
          <ComparisonStat label="Following" value1={data.user1.following} value2={data.user2.following} />
          <ComparisonStat label="Repositories" value1={data.user1.public_repos} value2={data.user2.public_repos} />
          <ComparisonStat label="Total Stars" value1={data.user1.total_stars} value2={data.user2.total_stars} />
          <ComparisonStat label="Active (90d)" value1={data.user1.repos_updated_90d} value2={data.user2.repos_updated_90d} />
        </div>

        <div className="dp-surface dp-reveal [animation-delay:160ms] mb-8 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-zinc-100">Language Skills</h2>
          <p className="mt-1 text-sm text-zinc-400">Languages used in their repositories</p>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            {data.comparison.shared_languages.length > 0 && (
              <div className="dp-surface rounded-lg border border-amber-400/20 p-4 transition-all duration-200 hover:shadow-[0_4px_12px_rgba(251,191,36,0.12)]">
                <p className="text-xs uppercase tracking-widest text-amber-300">Shared ({data.comparison.shared_languages.length})</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.comparison.shared_languages.slice(0, 6).map((lang) => (
                    <span key={lang} className="rounded-full bg-amber-400/20 px-2 py-1 text-xs font-semibold text-amber-300">
                      {lang}
                    </span>
                  ))}
                  {data.comparison.shared_languages.length > 6 && (
                    <span className="text-xs text-zinc-500">+{data.comparison.shared_languages.length - 6} more</span>
                  )}
                </div>
              </div>
            )}

            {data.comparison.only_user1_languages.length > 0 && (
              <div className="dp-surface rounded-lg border border-blue-400/20 p-4 transition-all duration-200 hover:shadow-[0_4px_12px_rgba(59,130,246,0.12)]">
                <p className="text-xs uppercase tracking-widest text-blue-300">Only {data.user1.name || data.user1.login}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.comparison.only_user1_languages.slice(0, 6).map((lang) => (
                    <span key={lang} className="rounded-full bg-blue-400/20 px-2 py-1 text-xs font-semibold text-blue-300">
                      {lang}
                    </span>
                  ))}
                  {data.comparison.only_user1_languages.length > 6 && (
                    <span className="text-xs text-zinc-500">+{data.comparison.only_user1_languages.length - 6} more</span>
                  )}
                </div>
              </div>
            )}

            {data.comparison.only_user2_languages.length > 0 && (
              <div className="dp-surface rounded-lg border border-green-400/20 p-4 transition-all duration-200 hover:shadow-[0_4px_12px_rgba(16,185,129,0.12)]">
                <p className="text-xs uppercase tracking-widest text-green-300">Only {data.user2.name || data.user2.login}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.comparison.only_user2_languages.slice(0, 6).map((lang) => (
                    <span key={lang} className="rounded-full bg-green-400/20 px-2 py-1 text-xs font-semibold text-green-300">
                      {lang}
                    </span>
                  ))}
                  {data.comparison.only_user2_languages.length > 6 && (
                    <span className="text-xs text-zinc-500">+{data.comparison.only_user2_languages.length - 6} more</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="dp-reveal [animation-delay:200ms] grid grid-cols-1 gap-6 md:grid-cols-2">
          {[
            { user: data.user1, title: `${data.user1.name || data.user1.login}'s Top Languages` },
            { user: data.user2, title: `${data.user2.name || data.user2.login}'s Top Languages` },
          ].map(({ user, title }) => {
            const totalBytes = user.top_languages.reduce((sum, { bytes }) => sum + bytes, 0);
            return (
              <div key={user.login} className="dp-surface dp-card-lift rounded-xl p-6 transition-all duration-200 hover:shadow-[0_4px_12px_rgba(251,191,36,0.12)]">
                <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
                <div className="mt-4 space-y-3">
                  {user.top_languages.map(({ lang, bytes }) => {
                    const percentage = totalBytes > 0 ? ((bytes / totalBytes) * 100).toFixed(1) : "0";
                    return (
                      <div key={lang}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-zinc-200">{lang}</span>
                          <span className="text-xs text-zinc-400">{percentage}%</span>
                        </div>
                        <div className="mt-1 h-2 w-full rounded bg-zinc-900">
                          <div className="h-full rounded bg-amber-400" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
