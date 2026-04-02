import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getRepos } from "@/lib/github";

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

export default async function ReposPage() {
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

  return (
    <div className="min-h-screen bg-[#0d0f12] p-6 text-zinc-200">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-xl border border-[#1e2229] bg-[#111318] p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Repos</p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-100">Your GitHub Repositories</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {sortedRepos.length} {sortedRepos.length === 1 ? "repository" : "repositories"} found
          </p>
        </div>

        {sortedRepos.length === 0 ? (
          <div className="rounded-xl border border-[#1e2229] bg-[#111318] p-8 text-center">
            <p className="text-lg font-semibold text-zinc-200">No repositories to display</p>
            <p className="mt-2 text-sm text-zinc-500">
              We could not find any repositories for this account right now.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sortedRepos.map((repo) => (
              <article
                key={repo.id}
                className="rounded-xl border border-[#1e2229] bg-[#111318] p-5 transition-colors hover:border-[#2f353f]"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-semibold text-zinc-100 transition-colors hover:text-amber-300"
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