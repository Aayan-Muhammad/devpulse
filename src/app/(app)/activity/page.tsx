import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getEvents } from "@/lib/github";
import type { GitHubEvent } from "@/types/github";
import { AlertTriangle } from "lucide-react";
import { ActivityFilterSync } from "./activity-filter-sync";

type ActivityPageProps = {
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

type IconMeta = {
  glyph: string;
  bgClass: string;
};

function getObject(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function getString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function getNumber(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

function formatDateHeading(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getDateKey(isoString: string): string {
  return new Date(isoString).toISOString().slice(0, 10);
}

function getEventIcon(type: string): IconMeta {
  const map: Record<string, IconMeta> = {
    PushEvent: { glyph: "↑", bgClass: "bg-amber-500/20 text-amber-300" },
    PullRequestEvent: { glyph: "PR", bgClass: "bg-blue-500/20 text-blue-300" },
    IssuesEvent: { glyph: "!", bgClass: "bg-red-500/20 text-red-300" },
    ForkEvent: { glyph: "⑂", bgClass: "bg-teal-500/20 text-teal-300" },
    WatchEvent: { glyph: "★", bgClass: "bg-yellow-500/20 text-yellow-300" },
    CreateEvent: { glyph: "+", bgClass: "bg-emerald-500/20 text-emerald-300" },
  };

  return map[type] ?? { glyph: "•", bgClass: "bg-zinc-700/30 text-zinc-300" };
}

function getEventDescription(event: GitHubEvent): string {
  const payload = getObject(event.payload) ?? {};

  if (event.type === "PushEvent") {
    const commits = Array.isArray(payload.commits) ? payload.commits : [];
    const commitMessages = commits
      .slice(0, 2)
      .map((commit) => getString(getObject(commit)?.message))
      .filter((message): message is string => Boolean(message));

    if (commitMessages.length > 0) {
      const remaining = commits.length - commitMessages.length;
      const suffix = remaining > 0 ? ` (+${remaining} more)` : "";
      return `Pushed ${commits.length} commit${commits.length === 1 ? "" : "s"}: ${commitMessages.join("; ")}${suffix}`;
    }

    const count = getNumber(payload.size) ?? commits.length;
    return `Pushed ${count} commit${count === 1 ? "" : "s"}`;
  }

  if (event.type === "PullRequestEvent") {
    const action = getString(payload.action) ?? "updated";
    const pr = getObject(payload.pull_request) ?? {};
    const title = getString(pr.title) ?? "a pull request";
    const number = getNumber(pr.number);
    return number ? `${action} pull request #${number}: ${title}` : `${action} ${title}`;
  }

  if (event.type === "IssuesEvent") {
    const action = getString(payload.action) ?? "updated";
    const issue = getObject(payload.issue) ?? {};
    const title = getString(issue.title) ?? "an issue";
    const number = getNumber(issue.number);
    return number ? `${action} issue #${number}: ${title}` : `${action} ${title}`;
  }

  if (event.type === "ForkEvent") {
    const forkee = getObject(payload.forkee) ?? {};
    const fullName = getString(forkee.full_name);
    return fullName ? `Forked into ${fullName}` : "Forked this repository";
  }

  if (event.type === "WatchEvent") {
    const action = getString(payload.action) ?? "started watching";
    return action === "started" ? "Starred this repository" : `${action} this repository`;
  }

  if (event.type === "CreateEvent") {
    const refType = getString(payload.ref_type) ?? "resource";
    const ref = getString(payload.ref);
    return ref ? `Created ${refType} ${ref}` : `Created a ${refType}`;
  }

  return `Triggered ${event.type}`;
}

export default async function ActivityPage({ searchParams }: ActivityPageProps) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const username = session.user?.username;

  if (!username) {
    redirect("/login");
  }

  let events: GitHubEvent[] = [];

  try {
    events = await getEvents(username, session.accessToken);
  } catch {
    return (
      <div className="dp-grid-bg min-h-screen bg-transparent p-6 text-zinc-200">
        <div className="mx-auto max-w-4xl">
          <div className="dp-surface dp-card-lift dp-reveal rounded-xl p-8">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#2a2f37] bg-[#0a0c0f] text-amber-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-semibold text-zinc-100">Activity feed temporarily unavailable</h1>
            <p className="mt-2 text-sm leading-7 text-zinc-400">
              We could not load your activity stream right now. This is usually temporary when GitHub
              API limits are reached.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/activity"
                className="dp-control rounded-lg px-4 py-2 text-sm font-semibold text-[#0d0f12] hover:shadow-[0_4px_12px_rgba(251,191,36,0.3)]"
                style={{ backgroundColor: "var(--accent-color)" }}
              >
                Try again
              </a>
              <Link
                href="/repos"
                className="dp-control rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-4 py-2 text-sm font-semibold text-zinc-200 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
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
  const typeFilter = getParam(resolvedSearchParams, "type").trim();
  const queryFilter = getParam(resolvedSearchParams, "q").trim().toLowerCase();

  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const knownTypes = [
    "PushEvent",
    "PullRequestEvent",
    "IssuesEvent",
    "ForkEvent",
    "WatchEvent",
    "CreateEvent",
  ];

  const filteredEvents = sortedEvents.filter((event) => {
    const typeMatches = !typeFilter || event.type === typeFilter;
    if (!typeMatches) {
      return false;
    }

    if (!queryFilter) {
      return true;
    }

    const description = getEventDescription(event).toLowerCase();
    return (
      event.repo.name.toLowerCase().includes(queryFilter) || description.includes(queryFilter)
    );
  });

  const groupedEvents = filteredEvents.reduce<Record<string, GitHubEvent[]>>((acc, event) => {
    const key = getDateKey(event.created_at);
    acc[key] = acc[key] ?? [];
    acc[key].push(event);
    return acc;
  }, {});

  const orderedDateKeys = Object.keys(groupedEvents).sort((a, b) => b.localeCompare(a));

  return (
    <div className="dp-grid-bg min-h-screen bg-transparent p-6 text-zinc-200">
      <ActivityFilterSync typeFilter={typeFilter} queryFilter={queryFilter} />
      <div className="mx-auto max-w-6xl">
        <header className="dp-surface dp-card-lift dp-reveal mb-6 rounded-xl p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Activity</p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-100">Recent Public Events</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"} shown
            {(typeFilter || queryFilter) ? ` (from ${sortedEvents.length} total)` : ""}
          </p>
        </header>

        <form method="GET" className="dp-surface dp-card-lift dp-reveal dp-reveal-delay-1 mb-6 rounded-xl p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1.3fr_auto]">
            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-widest text-zinc-500">Event type</span>
              <select
                name="type"
                defaultValue={typeFilter}
                className="dp-control h-11 w-full rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-3 text-zinc-100 outline-none focus:border-amber-400"
              >
                <option value="">All event types</option>
                {knownTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-widest text-zinc-500">
                Search repo or description
              </span>
              <input
                type="text"
                name="q"
                defaultValue={queryFilter}
                placeholder="repo name, commit text, action..."
                className="dp-control h-11 w-full rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-3 text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-400"
              />
            </label>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="dp-control h-11 rounded-lg px-4 text-sm font-semibold text-[#0d0f12] hover:shadow-[0_4px_12px_rgba(251,191,36,0.3)]"
                style={{ backgroundColor: "var(--accent-color)" }}
              >
                Apply
              </button>
              <a
                href="/activity"
                className="dp-control h-11 rounded-lg border border-[#2a2f37] px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:border-amber-400 hover:text-amber-300 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
              >
                Reset
              </a>
            </div>
          </div>
        </form>

        {filteredEvents.length === 0 ? (
          <div className="dp-surface dp-card-lift dp-reveal dp-reveal-delay-2 rounded-xl p-8 text-center">
            <p className="text-lg font-semibold text-zinc-200">No activity matches these filters</p>
            <p className="mt-2 text-sm text-zinc-500">
              Try clearing the event type or search query.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <a
                href="/activity"
                className="dp-control rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-3 py-2 text-xs font-semibold text-zinc-300 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
                style={{ borderColor: "var(--accent-color)" }}
              >
                Reset filters
              </a>
              <Link
                href="/explore"
                className="dp-control rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-3 py-2 text-xs font-semibold text-zinc-300 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
                style={{ borderColor: "var(--accent-color)" }}
              >
                Explore developers
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orderedDateKeys.map((dateKey) => {
              const dayEvents = groupedEvents[dateKey];
              return (
                <section key={dateKey} className="dp-surface dp-card-lift dp-reveal dp-reveal-delay-2 rounded-xl p-5">
                  <h2 className="mb-4 text-base font-semibold" style={{ color: "var(--accent-color)" }}>
                    {formatDateHeading(dayEvents[0].created_at)}
                  </h2>

                  <div className="space-y-4">
                    {dayEvents.map((event) => {
                      const icon = getEventIcon(event.type);
                      return (
                        <article key={event.id} className="dp-surface dp-card-lift rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <span
                              className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-1 text-xs font-bold ${icon.bgClass}`}
                            >
                              {icon.glyph}
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <p className="truncate text-sm font-semibold text-zinc-100">
                                  {event.repo.name}
                                </p>
                                <p className="text-xs uppercase tracking-wider text-zinc-500">
                                  {formatTime(event.created_at)}
                                </p>
                              </div>

                              <p className="mt-1 text-sm text-zinc-300">{getEventDescription(event)}</p>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}