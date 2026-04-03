import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getContributionCalendar,
  getEvents,
  getLanguageStats,
  getRepos,
  getUser,
} from "@/lib/github";
import Link from "next/link";
import ShareProfileButton from "./share-profile-button";

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

function getContributionColor(count: number, max: number): string {
  if (count === 0) return "bg-[#1a1f26]";

  const ratio = count / Math.max(max, 1);

  if (ratio < 0.25) return "bg-[#6b3b16]";
  if (ratio < 0.5) return "bg-[#9a4d15]";
  if (ratio < 0.75) return "bg-[#cf6a17]";
  return "bg-[#f0a030]";
}

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/landing");
  }

  const username = session.user?.username;

  if (!username) {
    redirect("/login");
  }

  const [user, repos, events, languages, contributionCalendar] = await Promise.all([
    getUser(username, session.accessToken),
    getRepos(username, session.accessToken),
    getEvents(username, session.accessToken),
    getLanguageStats(username, session.accessToken),
    getContributionCalendar(username, session.accessToken),
  ]);

  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const mostStarredRepo = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count)[0];

  const languageEntries = Object.entries(languages)
    .map(([lang, bytes]) => ({ lang, bytes }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 5);

  const totalBytes = languageEntries.reduce((sum, { bytes }) => sum + bytes, 0);

  const pushEvents = events.filter((e) => e.type === "PushEvent").slice(0, 10);
  const allPushEvents = events.filter((e) => e.type === "PushEvent");

  const now = new Date();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const sevenDaysAgo = new Date(now.getTime() - 7 * oneDayMs);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * oneDayMs);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * oneDayMs);

  const pushesLast7Days = allPushEvents.filter(
    (event) => new Date(event.created_at).getTime() >= sevenDaysAgo.getTime()
  ).length;
  const pushesPrev7Days = allPushEvents.filter((event) => {
    const eventTime = new Date(event.created_at).getTime();
    return eventTime >= fourteenDaysAgo.getTime() && eventTime < sevenDaysAgo.getTime();
  }).length;

  const pushDelta = pushesLast7Days - pushesPrev7Days;
  const pushDeltaLabel =
    pushDelta > 0 ? `+${pushDelta} vs previous 7d` : `${pushDelta} vs previous 7d`;

  const activeReposLast30Days = new Set(
    allPushEvents
      .filter((event) => new Date(event.created_at).getTime() >= thirtyDaysAgo.getTime())
      .map((event) => event.repo.name)
  ).size;

  const contributionDays = contributionCalendar.weeks.flatMap((week) => week.contributionDays);
  const maxContributionCount = contributionDays.reduce(
    (max, day) => Math.max(max, day.contributionCount),
    0
  );

  const monthLabels = contributionCalendar.weeks.map((week, index) => {
    const date = new Date(week.firstDay);
    return date.getDate() <= 7
      ? { label: date.toLocaleString("en-US", { month: "short" }), index }
      : null;
  });

  return (
    <div className="min-h-screen bg-[#0d0f12] p-6 text-zinc-200">
      <div className="dp-card-lift dp-reveal mb-8 flex items-center justify-between rounded-xl border border-[#1e2229] bg-[#111318] p-6">
        <div className="flex items-center gap-4">
          <img
            src={user.avatar_url}
            alt={user.login}
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover"
          />
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">{user.name || user.login}</h1>
            <p className="text-sm text-zinc-400">@{user.login}</p>
            {user.bio && <p className="mt-1 text-sm text-zinc-300">{user.bio}</p>}
          </div>
        </div>
        <ShareProfileButton username={username} />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="dp-card-lift dp-reveal dp-reveal-delay-1 rounded-xl border border-[#1e2229] bg-[#111318] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Total Repos</p>
          <p className="mt-2 text-3xl font-bold text-zinc-100">{user.public_repos}</p>
        </div>
        <div className="dp-card-lift dp-reveal dp-reveal-delay-1 rounded-xl border border-[#1e2229] bg-[#111318] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Followers</p>
          <p className="mt-2 text-3xl font-bold text-zinc-100">{user.followers}</p>
        </div>
        <div className="dp-card-lift dp-reveal dp-reveal-delay-2 rounded-xl border border-[#1e2229] bg-[#111318] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Following</p>
          <p className="mt-2 text-3xl font-bold text-zinc-100">{user.following}</p>
        </div>
        <div className="dp-card-lift dp-reveal dp-reveal-delay-2 rounded-xl border border-[#1e2229] bg-[#111318] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Total Stars</p>
          <p className="mt-2 text-3xl font-bold text-zinc-100">{totalStars}</p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="dp-card-lift dp-reveal dp-reveal-delay-2 rounded-xl border border-[#1e2229] bg-[#111318] p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Push Trend</p>
          <p className="mt-2 text-3xl font-bold text-zinc-100">{pushesLast7Days}</p>
          <p className={`mt-1 text-sm ${pushDelta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {pushDeltaLabel}
          </p>
        </div>

        <div className="dp-card-lift dp-reveal dp-reveal-delay-3 rounded-xl border border-[#1e2229] bg-[#111318] p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Active Repositories
          </p>
          <p className="mt-2 text-3xl font-bold text-zinc-100">{activeReposLast30Days}</p>
          <p className="mt-1 text-sm text-zinc-400">With at least one push in last 30 days</p>
        </div>

        <div className="dp-card-lift dp-reveal dp-reveal-delay-3 rounded-xl border border-[#1e2229] bg-[#111318] p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Top Repository</p>
          <p className="mt-2 truncate text-lg font-semibold text-zinc-100">
            {mostStarredRepo?.name ?? "No repositories"}
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            {mostStarredRepo ? `${mostStarredRepo.stargazers_count} stars` : "Add repositories to see this insight"}
          </p>
        </div>
      </div>

      <div className="dp-card-lift dp-reveal dp-reveal-delay-3 mb-8 rounded-xl border border-[#1e2229] bg-[#111318] p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Quick Actions</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/activity"
            className="rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-4 py-2 text-sm font-semibold text-zinc-200 transition-all duration-200 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
            style={{ borderColor: "var(--accent-color)" }}
          >
            Review Activity Feed
          </Link>
          <Link
            href="/projects"
            className="rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-4 py-2 text-sm font-semibold text-zinc-200 transition-all duration-200 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
            style={{ borderColor: "var(--accent-color)" }}
          >
            Open Project Index
          </Link>
          <Link
            href="/languages"
            className="rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-4 py-2 text-sm font-semibold text-zinc-200 transition-all duration-200 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
            style={{ borderColor: "var(--accent-color)" }}
          >
            Inspect Language Mix
          </Link>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="dp-card-lift dp-reveal dp-reveal-delay-3 rounded-xl border border-[#1e2229] bg-[#111318] p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-100">Recent Activity</h2>
          <div className="space-y-3">
            {pushEvents.length > 0 ? (
              pushEvents.map((event) => (
                <div key={event.id} className="border-l-2 border-amber-400 py-2 pl-4">
                  <p className="text-sm font-medium text-zinc-200">{event.repo.name}</p>
                  <p className="text-xs text-zinc-400">{formatDate(event.created_at)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">No recent activity</p>
            )}
          </div>
        </div>

        <div className="dp-card-lift dp-reveal dp-reveal-delay-3 rounded-xl border border-[#1e2229] bg-[#111318] p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-100">Top Languages</h2>
          <div className="space-y-3">
            {languageEntries.length > 0 ? (
              languageEntries.map(({ lang, bytes }) => {
                const percentage =
                  totalBytes > 0 ? ((bytes / totalBytes) * 100).toFixed(1) : "0";
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
              })
            ) : (
              <p className="text-sm text-zinc-500">No language data</p>
            )}
          </div>
        </div>
      </div>

      <div className="dp-card-lift dp-reveal dp-reveal-delay-3 rounded-xl border border-[#1e2229] bg-[#111318] p-6">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Contribution Heatmap</h2>
            <p className="text-sm text-zinc-400">Past year commit activity</p>
          </div>
          <p className="text-sm font-semibold text-amber-400">
            {contributionCalendar.totalContributions} contributions
          </p>
        </div>

        {contributionCalendar.weeks.length > 0 ? (
          <div className="overflow-x-auto pb-2">
            <div className="min-w-max">
              <div className="mb-2 ml-8 flex gap-1 text-[10px] uppercase tracking-wider text-zinc-500">
                {monthLabels.map((month, index) => (
                  <span key={`${month?.label ?? "blank"}-${index}`} className="w-[14px] text-center">
                    {month?.label ?? ""}
                  </span>
                ))}
              </div>

              <div className="flex gap-1">
                <div className="mt-[1px] flex flex-col gap-1 pr-2 text-[10px] text-zinc-500">
                  <span>Mon</span>
                  <span className="mt-3">Wed</span>
                  <span className="mt-3">Fri</span>
                </div>

                <div className="flex gap-1">
                  {contributionCalendar.weeks.map((week) => (
                    <div key={week.firstDay} className="flex flex-col gap-1">
                      {week.contributionDays.map((day) => (
                        <div
                          key={day.date}
                          title={`${day.contributionCount} contributions on ${day.date}`}
                          className={`h-[11px] w-[11px] rounded-[3px] ring-1 ring-black/10 ${getContributionColor(
                            day.contributionCount,
                            maxContributionCount
                          )}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 text-xs text-zinc-500">
              <span>Less</span>
              <span className="h-2.5 w-2.5 rounded-sm bg-[#1a1f26]" />
              <span className="h-2.5 w-2.5 rounded-sm bg-[#6b3b16]" />
              <span className="h-2.5 w-2.5 rounded-sm bg-[#9a4d15]" />
              <span className="h-2.5 w-2.5 rounded-sm bg-[#cf6a17]" />
              <span className="h-2.5 w-2.5 rounded-sm bg-[#f0a030]" />
              <span>More</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Unable to load contribution data right now.</p>
        )}
      </div>
    </div>
  );
}