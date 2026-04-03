import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getRepos } from "@/lib/github";

type ReposPageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

const LANGUAGE_COLORS: string[] = [
  "#f0a030",
  "#cf6a17",
  "#d97706",
  "#fb923c",
  "#84cc16",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#ec4899",
];

function formatUpdatedDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getLanguageColor(language: string): string {
  let hash = 0;

  for (let i = 0; i < language.length; i += 1) {
    hash = (hash * 31 + language.charCodeAt(i)) >>> 0;
  }

  return LANGUAGE_COLORS[hash % LANGUAGE_COLORS.length];
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

export default async function ReposPage({ searchParams }: ReposPageProps) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const username = session.user?.username;

  if (!username) {
    redirect("/login");
  }

  const repos = await getRepos(username, session.accessToken);
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

  return (
    <div className="min-h-screen bg-[#0d0f12] p-6 text-zinc-200">
      <div className="mx-auto max-w-7xl">
        <div className="dp-card-lift dp-reveal mb-6 rounded-xl border border-[#1e2229] bg-[#111318] p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Repos</p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-100">Your GitHub Repositories</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {sortedRepos.length} {sortedRepos.length === 1 ? "repository" : "repositories"} shown
            {(queryFilter || languageFilter) ? ` (from ${repos.length} total)` : ""}
          </p>
        </div>

        <form method="GET" className="dp-card-lift dp-reveal dp-reveal-delay-1 mb-6 rounded-xl border border-[#1e2229] bg-[#111318] p-5">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_1fr_1fr_auto]">
            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-widest text-zinc-500">Search</span>
              <input
                type="text"
                name="q"
                defaultValue={queryFilter}
                placeholder="Repository name or description"
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
              <a
                href="/repos"
                className="h-11 rounded-lg border border-[#2a2f37] px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-all duration-200 hover:border-amber-400 hover:text-amber-300 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
              >
                Reset
              </a>
            </div>
          </div>
        </form>

        {sortedRepos.length === 0 ? (
          <div className="dp-card-lift dp-reveal dp-reveal-delay-2 rounded-xl border border-[#1e2229] bg-[#111318] p-8 text-center">
            <p className="text-lg font-semibold text-zinc-200">No repositories match these filters</p>
            <p className="mt-2 text-sm text-zinc-500">
              Try changing search, language, or sorting options.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sortedRepos.map((repo) => (
              <article
                key={repo.id}
                className="dp-card-lift dp-reveal dp-reveal-delay-2 rounded-xl border border-[#1e2229] bg-[#111318] p-5 transition-colors hover:border-[#2f353f]"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-semibold text-zinc-100 transition-colors hover:text-amber-300"
                    style={{ color: "var(--accent-color)" }}
                  >
                    {repo.name}
                  </a>
                </div>

                <p className="mb-4 min-h-12 text-sm leading-relaxed text-zinc-400">
                  {repo.description ?? "No description provided."}
                </p>

                <div className="mb-4 flex items-center gap-4 text-sm text-zinc-300">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: repo.language
                          ? getLanguageColor(repo.language)
                          : "#52525b",
                      }}
                    />
                    {repo.language ?? "Unknown"}
                  </span>

                  <span className="text-zinc-500">★ {repo.stargazers_count}</span>
                  <span className="text-zinc-500">⑂ {repo.forks_count}</span>
                </div>

                <p className="text-xs uppercase tracking-wider text-zinc-500">
                  Updated {formatUpdatedDate(repo.updated_at)}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}