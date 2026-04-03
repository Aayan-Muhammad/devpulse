import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getRepos } from "@/lib/github";

function formatUpdatedDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ProjectsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const username = session.user?.username;

  if (!username) {
    redirect("/login");
  }

  const repos = await getRepos(username, session.accessToken);
  const sortedRepos = [...repos].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  const totalStars = sortedRepos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const totalForks = sortedRepos.reduce((sum, repo) => sum + repo.forks_count, 0);

  return (
    <div className="min-h-screen bg-[#0d0f12] p-6 text-zinc-200">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-xl border border-[#1e2229] bg-[#111318] p-6">
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
        </div>

        {sortedRepos.length === 0 ? (
          <div className="rounded-xl border border-[#1e2229] bg-[#111318] p-8 text-center">
            <p className="text-lg font-semibold text-zinc-100">No projects found</p>
            <p className="mt-2 text-sm text-zinc-500">
              We could not load repositories for this account at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedRepos.map((repo) => (
              <article
                key={repo.id}
                className="rounded-xl border border-[#1e2229] bg-[#111318] p-5 transition-colors hover:border-[#2f353f]"
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
                      className="rounded-lg border border-[#1e2229] bg-[#0a0c0f] px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-amber-400 hover:text-amber-300"
                    >
                      View details
                    </Link>
                    <a
                      href={repo.html_url}
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
        )}
      </div>
    </div>
  );
}