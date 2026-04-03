import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getEvents } from "@/lib/github";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

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

export default async function CommitsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const username = session.user?.username ?? "";

  if (!username) {
    redirect("/login");
  }

  const events = await getEvents(username, session.accessToken!);

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

  const totalCommits = sortedGroups.reduce((sum, group) => sum + group.commits.length, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-100">Commits</h1>
        <p className="mt-2 text-zinc-400">
          Your recent push events and commit history
        </p>
      </div>

      {/* Total commit count card */}
      <div className="rounded-xl border border-[#1e2229] bg-[#111318] p-6">
        <div className="text-center">
          <p className="text-sm uppercase tracking-widest text-zinc-500">Total Commits</p>
          <p className="mt-2 text-5xl font-bold text-amber-400">{totalCommits}</p>
        </div>
      </div>

      {/* Commits list */}
      {sortedGroups.length === 0 ? (
        <div className="rounded-xl border border-[#1e2229] bg-[#111318] p-8 text-center text-zinc-400">
          No recent push events found. Start pushing to see your commits here.
        </div>
      ) : (
        <div className="space-y-6">
          {sortedGroups.map((group) => (
            <div key={`${group.repoName}|${group.branch}`} className="space-y-3">
              {/* Repository header */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <Link
                    href={group.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-semibold text-amber-400 transition-colors hover:text-amber-300"
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
                {group.commits.map((commit) => (
                  <div
                    key={commit.sha}
                    className="rounded-lg border border-[#1e2229] bg-[#0a0c0f] p-4 transition-colors hover:border-amber-400/30 hover:bg-[#111318]"
                  >
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
                            className="font-mono text-amber-400/70 transition-colors hover:text-amber-400"
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