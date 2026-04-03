import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getRepos } from "@/lib/github";
import { AlertTriangle } from "lucide-react";

type ProjectsPageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

function formatUpdatedDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string
): string {
  const value = params[key];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? "";
  return "";
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const username = session.user?.username;

  if (!username) {
    redirect("/login");
  }

  let repos = [];

  try {
    repos = await getRepos(username, session.accessToken);
  } catch {
    return (
      <div className="min-h-screen bg-[#0d0f12] p-6 text-zinc-200">
        <div className="mx-auto max-w-4xl">
          <div className="dp-card-lift dp-reveal rounded-xl border border-[#1e2229] bg-[#111318] p-8">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#2a2f37] bg-[#0a0c0f] text-amber-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-semibold text-zinc-100">Project index temporarily unavailable</h1>
            <p className="mt-2 text-sm leading-7 text-zinc-400">
              We could not fetch your repositories to build the project index. This is often temporary
              and usually resolves after a short wait.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/projects"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-[#0d0f12] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(251,191,36,0.3)]"
                style={{ backgroundColor: "var(--accent-color)" }}
              >
                Try again
              </a>
              <Link
                href="/repos"
                className="rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-4 py-2 text-sm font-semibold text-zinc-200 transition-all duration-200 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
                style={{ borderColor: "var(--accent-color)" }}
              >
                Go to repositories
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const queryFilter = getParam(resolvedSearchParams, "q").trim().toLowerCase();
  const languageFilter = getParam(resolvedSearchParams, "language").trim();
  const sortBy = getParam(resolvedSearchParams, "sort").trim() || "updated";

  const languageOptions = Array.from(
    new Set(repos.map((repo) => repo.language).filter((lang): lang is string => Boolean(lang)))
  ).sort((a, b) => a.localeCompare(b));

  const filteredRepos = repos.filter((repo) => {
    const matchesQuery =
      !queryFilter ||
      repo.name.toLowerCase().includes(queryFilter) ||
      (repo.description ?? "").toLowerCase().includes(queryFilter);
    const matchesLanguage = !languageFilter || repo.language === languageFilter;
    return matchesQuery && matchesLanguage;
  });

  const sortedRepos = [...filteredRepos].sort((a, b) => {
    if (sortBy === "stars") return b.stargazers_count - a.stargazers_count;
    if (sortBy === "forks") return b.forks_count - a.forks_count;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const totalStars = sortedRepos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const totalForks = sortedRepos.reduce((sum, repo) => sum + repo.forks_count, 0);

  return (
    <div className="min-h-screen bg-[#0d0f12] p-6 text-zinc-200">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="dp-reveal [animation-delay:40ms] rounded-xl border border-[#1e2229] bg-[#111318] p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Projects</p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-100">Repository Index</h1>
          <p className="mt-2 text-sm text-zinc-400">
            A clean index of your repositories with direct links to each project detail page.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[#1e2229] bg-[#0a0c0f] p-4">
              <p className="text-xs uppercase tracking-widest text-zinc-500">Total Projects</p>
              <p className="mt-1 text-2xl font-bold text-zinc-100">{sortedRepos.length}</p>
            </div>
            <div className="rounded-lg border border-[#1e2229] bg-[#0a0c0f] p-4">
              <p className="text-xs uppercase tracking-widest text-zinc-500">Total Stars</p>
              <p className="mt-1 text-2xl font-bold text-zinc-100">{totalStars}</p>
            </div>
            <div className="rounded-lg border border-[#1e2229] bg-[#0a0c0f] p-4">
              <p className="text-xs uppercase tracking-widest text-zinc-500">Total Forks</p>
              <p className="mt-1 text-2xl font-bold text-zinc-100">{totalForks}</p>
            </div>
          </div>

          {(queryFilter || languageFilter) && (
            <p className="mt-3 text-xs text-zinc-500">Filtered from {repos.length} total repositories</p>
          )}
        </div>

        <form
          method="GET"
          className="dp-reveal [animation-delay:80ms] rounded-xl border border-[#1e2229] bg-[#111318] p-5"
        >
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_1fr_1fr_auto]">
            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-widest text-zinc-500">Search</span>
              <input
                type="text"
                name="q"
                defaultValue={queryFilter}
                placeholder="Project name or description"
                className="h-11 w-full rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-3 text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-amber-400"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-widest text-zinc-500">Language</span>
              <select
                name="language"
                defaultValue={languageFilter}
                className="h-11 w-full rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-3 text-zinc-100 outline-none transition-colors focus:border-amber-400"
              >
                <option value="">All languages</option>
                {languageOptions.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-widest text-zinc-500">Sort by</span>
              <select
                name="sort"
                defaultValue={sortBy}
                className="h-11 w-full rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-3 text-zinc-100 outline-none transition-colors focus:border-amber-400"
              >
                <option value="updated">Recently updated</option>
                <option value="stars">Most stars</option>
                <option value="forks">Most forks</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </label>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="h-11 rounded-lg px-4 text-sm font-semibold text-[#0d0f12] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(251,191,36,0.3)]"
                style={{ backgroundColor: "var(--accent-color)" }}
              >
                Apply
              </button>
              <Link
                href="/projects"
                className="h-11 rounded-lg border border-[#2a2f37] px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-all duration-200 hover:border-amber-400 hover:text-amber-300 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
              >
                Reset
              </Link>
            </div>
          </div>
        </form>

        {sortedRepos.length === 0 ? (
          <div className="dp-reveal [animation-delay:120ms] rounded-xl border border-[#1e2229] bg-[#111318] p-8 text-center">
            <p className="text-lg font-semibold text-zinc-100">No projects match these filters</p>
            <p className="mt-2 text-sm text-zinc-500">
              Try changing search text, language, or sorting.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link
                href="/projects"
                className="rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-3 py-2 text-xs font-semibold text-zinc-300 transition-all duration-200 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
                style={{ borderColor: "var(--accent-color)" }}
              >
                Reset filters
              </Link>
              <Link
                href="/explore"
                className="rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-3 py-2 text-xs font-semibold text-zinc-300 transition-all duration-200 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
                style={{ borderColor: "var(--accent-color)" }}
              >
                Explore developers
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedRepos.map((repo, index) => (
              <article
                key={repo.id}
                className="dp-reveal dp-card-lift rounded-xl border border-[#1e2229] bg-[#111318] p-5 transition-colors hover:border-[#2f353f]"
                style={{ animationDelay: `${120 + index * 28}ms` }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-zinc-100">{repo.name}</h2>
                    <p className="mt-1 line-clamp-1 text-sm text-zinc-400">
                      {repo.description ?? "No description provided."}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                      <span>{repo.language ?? "Unknown"}</span>
                      <span>★ {repo.stargazers_count}</span>
                      <span>⑂ {repo.forks_count}</span>
                      <span>Updated {formatUpdatedDate(repo.updated_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/projects/${encodeURIComponent(repo.name)}`}
                      className="rounded-lg border border-[#1e2229] bg-[#0a0c0f] px-4 py-2 text-sm font-semibold text-zinc-200 transition-all duration-200 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
                      style={{ borderColor: "var(--accent-color)" }}
                    >
                      View details
                    </Link>
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-[#1e2229] px-4 py-2 text-sm font-semibold transition-all duration-200 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
                      style={{ borderColor: "var(--accent-color)", color: "var(--accent-color)" }}
                    >
                      GitHub
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}