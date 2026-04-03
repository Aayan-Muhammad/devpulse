import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getRepos } from "@/lib/github";

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const username = session.user?.username;

  if (!username) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const projectName = decodeURIComponent(resolvedParams.name);
  const repos = await getRepos(username, session.accessToken);

  const repo = repos.find(
    (item) => item.name === projectName || item.full_name.endsWith(`/${projectName}`)
  );

  if (!repo) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0d0f12] p-6 text-zinc-200">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="dp-reveal [animation-delay:40ms] rounded-xl border border-[#1e2229] bg-[#111318] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Project
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-zinc-100">{repo.name}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                {repo.description ?? "No description provided for this repository."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/repos"
                className="rounded-lg border border-[#1e2229] bg-[#0a0c0f] px-4 py-2 text-sm font-semibold text-zinc-300 transition-all duration-200 hover:border-amber-400 hover:text-amber-300 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
              >
                Back to repos
              </Link>
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-[#1e2229] bg-amber-400 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-amber-300"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="dp-reveal dp-card-lift [animation-delay:80ms] rounded-xl border border-[#1e2229] bg-[#111318] p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Stars</p>
            <p className="mt-2 text-3xl font-bold text-zinc-100">{repo.stargazers_count}</p>
          </div>
          <div className="dp-reveal dp-card-lift [animation-delay:110ms] rounded-xl border border-[#1e2229] bg-[#111318] p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Forks</p>
            <p className="mt-2 text-3xl font-bold text-zinc-100">{repo.forks_count}</p>
          </div>
          <div className="dp-reveal dp-card-lift [animation-delay:140ms] rounded-xl border border-[#1e2229] bg-[#111318] p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Open Issues</p>
            <p className="mt-2 text-3xl font-bold text-zinc-100">{repo.open_issues_count}</p>
          </div>
          <div className="dp-reveal dp-card-lift [animation-delay:170ms] rounded-xl border border-[#1e2229] bg-[#111318] p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Default Branch</p>
            <p className="mt-2 text-3xl font-bold text-zinc-100">{repo.default_branch}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="dp-reveal dp-card-lift [animation-delay:210ms] rounded-xl border border-[#1e2229] bg-[#111318] p-6">
            <h2 className="text-lg font-semibold text-zinc-100">Repository Details</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4 border-b border-[#1e2229] pb-3">
                <dt className="text-zinc-500">Language</dt>
                <dd className="font-medium text-zinc-200">{repo.language ?? "Unknown"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-[#1e2229] pb-3">
                <dt className="text-zinc-500">Created</dt>
                <dd className="font-medium text-zinc-200">{formatDate(repo.created_at)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-[#1e2229] pb-3">
                <dt className="text-zinc-500">Updated</dt>
                <dd className="font-medium text-zinc-200">{formatDate(repo.updated_at)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-[#1e2229] pb-3">
                <dt className="text-zinc-500">Last Push</dt>
                <dd className="font-medium text-zinc-200">{formatDate(repo.pushed_at)}</dd>
              </div>
            </dl>
          </div>

          <div className="dp-reveal dp-card-lift [animation-delay:250ms] rounded-xl border border-[#1e2229] bg-[#111318] p-6">
            <h2 className="text-lg font-semibold text-zinc-100">Quick Context</h2>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              This project page is the destination for the sidebar project links. It uses the
              authenticated repo list so each repo opens a valid detail page instead of a 404.
            </p>
            <div className="mt-6 rounded-lg border border-[#1e2229] bg-[#0a0c0f] p-4 text-sm text-zinc-300">
              <p className="font-semibold text-zinc-100">Full name</p>
              <p className="mt-1 break-all text-zinc-400">{repo.full_name}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}