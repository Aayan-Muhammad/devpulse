import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getEvents } from "@/lib/github";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle } from "lucide-react";

type Commit = {
  message: string;
  sha: string;
  url: string;
  author: string;
};

type GroupedCommits = {
  repoName: string;
  repoUrl: string;
  branch: string;
  commits: Commit[];
  pushedAt: string;
};

type CommitsPageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string
): string {
  const value = params[key];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? "";
  return "";
}

function getObject(obj: unknown): Record<string, unknown> {
  return typeof obj === "object" && obj !== null ? (obj as Record<string, unknown>) : {};
}

function getString(obj: unknown, key: string): string {
  const value = getObject(obj)[key];
  return typeof value === "string" ? value : "";
}

function getArray(obj: unknown, key: string): unknown[] {
  const value = getObject(obj)[key];
  return Array.isArray(value) ? value : [];
}

function extractCommits(payload: unknown): Commit[] {
  try {
    const commits = getArray(payload, "commits");
    return commits.map((commit) => ({
      message: getString(commit, "message"),
      sha: getString(commit, "sha").slice(0, 7),
      url: getString(commit, "url"),
      author: getString(commit, "author") || "Unknown",
    }));
  } catch {
    return [];
  }
}

export default async function CommitsPage({ searchParams }: CommitsPageProps) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const username = session.user?.username ?? "";

  if (!username) {
    redirect("/login");
  }

  let events = [];

  try {
    events = await getEvents(username, session.accessToken!);
  } catch {
    return (
      <div className="dp-surface rounded-xl p-8 text-zinc-200">
        <div className="dp-surface mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl text-amber-300">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold text-zinc-100">Commit history temporarily unavailable</h1>
        <p className="mt-2 text-sm leading-7 text-zinc-400">
          We could not load commit history right now. This is usually temporary and can happen during
          API rate-limit windows.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="/commits"
            className="dp-control rounded-lg px-4 py-2 text-sm font-semibold text-[#0d0f12] hover:shadow-[0_4px_12px_rgba(251,191,36,0.3)]"
            style={{ backgroundColor: "var(--accent-color)" }}
          >
            Try again
          </a>
          <Link
            href="/activity"
            className="dp-control rounded-lg border border-[#2a2f37] px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-amber-400 hover:text-amber-300 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
            style={{ borderColor: "var(--accent-color)" }}
          >
            Go to activity
          </Link>
        </div>
      </div>
    );
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const repoFilter = getParam(resolvedSearchParams, "repo").trim();
  const queryFilter = getParam(resolvedSearchParams, "q").trim().toLowerCase();

  // Filter for PushEvents and group by repository
  const groupedByRepo: Map<string, GroupedCommits> = new Map();

  for (const event of events) {
    if (event.type !== "PushEvent") continue;

    const payload = event.payload as Record<string, unknown>;
    const repoName = event.repo.name;
    const repoUrl = `https://github.com/${repoName}`;
    const branch = getString(payload, "ref")?.replace("refs/heads/", "") || "main";
    const commits = extractCommits(payload);

    if (commits.length === 0) continue;

    const key = `${repoName}|${branch}`;

    if (!groupedByRepo.has(key)) {
      groupedByRepo.set(key, {
        repoName,
        repoUrl,
        branch,
        commits: [],
        pushedAt: event.created_at,
      });
    }

    const group = groupedByRepo.get(key);
    if (group) {
      group.commits.push(...commits);
      group.pushedAt = event.created_at;
    }
  }

  // Sort groups by most recent push
  const sortedGroups = Array.from(groupedByRepo.values()).sort(
    (a, b) => new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime()
  );

  const repoOptions = Array.from(new Set(sortedGroups.map((group) => group.repoName))).sort((a, b) =>
    a.localeCompare(b)
  );

  const filteredGroups = sortedGroups
    .map((group) => {
      const matchesRepo = !repoFilter || group.repoName === repoFilter;
      if (!matchesRepo) {
        return null;
      }

      if (!queryFilter) {
        return group;
      }

      const filteredCommits = group.commits.filter((commit) =>
        commit.message.toLowerCase().includes(queryFilter)
      );

      if (!filteredCommits.length) {
        return null;
      }

      return {
        ...group,
        commits: filteredCommits,
      };
    })
    .filter((group): group is GroupedCommits => Boolean(group));

  const totalCommits = filteredGroups.reduce((sum, group) => sum + group.commits.length, 0);
  const totalUnfilteredCommits = sortedGroups.reduce((sum, group) => sum + group.commits.length, 0);

  return (
    <div className="dp-grid-bg space-y-8 bg-transparent">
      <div className="dp-reveal [animation-delay:40ms]">
        <h1 className="text-3xl font-bold text-zinc-100">Commits</h1>
        <p className="mt-2 text-zinc-400">
          Your recent push events and commit history
        </p>
      </div>

      <form
        method="GET"
        className="dp-surface dp-reveal [animation-delay:80ms] rounded-xl p-5"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.3fr_1fr_auto]">
          <label className="text-sm">
            <span className="mb-1 block text-xs uppercase tracking-widest text-zinc-500">
              Search commit message
            </span>
            <input
              type="text"
              name="q"
              defaultValue={queryFilter}
              placeholder="fix, feature, refactor..."
                className="dp-control h-11 w-full rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-3 text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-400"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-xs uppercase tracking-widest text-zinc-500">Repository</span>
            <select
              name="repo"
              defaultValue={repoFilter}
              className="dp-control h-11 w-full rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-3 text-zinc-100 outline-none focus:border-amber-400"
            >
              <option value="">All repositories</option>
              {repoOptions.map((repo) => (
                <option key={repo} value={repo}>
                  {repo}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="dp-control h-11 rounded-lg px-4 text-sm font-semibold text-[#0d0f12] hover:shadow-[0_4px_12px_rgba(251,191,36,0.3)]"
              style={{ backgroundColor: "var(--accent-color)" }}
            >
              Apply
            </button>
            <Link
              href="/commits"
              className="dp-control h-11 rounded-lg border border-[#2a2f37] px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:border-amber-400 hover:text-amber-300 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
            >
              Reset
            </Link>
          </div>
        </div>
      </form>

      {/* Total commit count card */}
      <div className="dp-surface dp-reveal [animation-delay:120ms] rounded-xl p-6">
        <div className="text-center">
          <p className="text-sm uppercase tracking-widest text-zinc-500">Total Commits</p>
          <p className="mt-2 text-5xl font-bold" style={{ color: "var(--accent-color)" }}>{totalCommits}</p>
          {(repoFilter || queryFilter) && (
            <p className="mt-2 text-xs text-zinc-500">Filtered from {totalUnfilteredCommits} total commits</p>
          )}
        </div>
      </div>

      {/* Commits list */}
      {filteredGroups.length === 0 ? (
        <div className="dp-surface dp-reveal [animation-delay:160ms] rounded-xl p-8 text-center text-zinc-400">
          <p className="text-lg font-semibold text-zinc-200">No commits match the current filters</p>
          <p className="mt-2 text-sm text-zinc-500">Try adjusting the search or selected repository.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link
              href="/commits"
              className="dp-control rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-3 py-2 text-xs font-semibold text-zinc-300 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
              style={{ borderColor: "var(--accent-color)" }}
            >
              Reset filters
            </Link>
            <Link
              href="/repos"
              className="dp-control rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-3 py-2 text-xs font-semibold text-zinc-300 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
              style={{ borderColor: "var(--accent-color)" }}
            >
              Go to repositories
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map((group, groupIndex) => (
            <div
              key={`${group.repoName}|${group.branch}`}
              className="dp-reveal space-y-3"
              style={{ animationDelay: `${180 + groupIndex * 40}ms` }}
            >
              {/* Repository header */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <Link
                    href={group.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-semibold transition-colors hover:text-amber-300"
                    style={{ color: "var(--accent-color)" }}
                  >
                    {group.repoName}
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="inline-block h-2 w-2 rounded-full bg-zinc-600" />
                    {group.branch}
                  </div>
                </div>
                <div className="text-right text-xs text-zinc-500">
                  {formatDistanceToNow(new Date(group.pushedAt), { addSuffix: true })}
                </div>
              </div>

              {/* Commits for this repository */}
                  <div className="space-y-2 border-l-2 border-[#1e2229] pl-4">
                {group.commits.map((commit, commitIndex) => (
                  <div key={commit.sha} className="dp-surface dp-card-lift rounded-lg p-4" style={{ animationDelay: `${220 + commitIndex * 18}ms` }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="whitespace-pre-wrap break-words text-sm font-medium text-zinc-100">
                          {commit.message}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                          <Link
                            href={commit.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono transition-colors hover:text-amber-400"
                            style={{ color: "color-mix(in oklab, var(--accent-color), transparent 30%)" }}
                          >
                            {commit.sha}
                          </Link>
                          {commit.author && <span>by {commit.author}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}