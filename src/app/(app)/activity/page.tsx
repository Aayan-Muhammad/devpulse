import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getEvents } from "@/lib/github";
import type { GitHubEvent } from "@/types/github";

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

export default async function ActivityPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const username = session.user?.username;

  if (!username) {
    redirect("/login");
  }

  const events = await getEvents(username, session.accessToken);
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const groupedEvents = sortedEvents.reduce<Record<string, GitHubEvent[]>>((acc, event) => {
    const key = getDateKey(event.created_at);
    acc[key] = acc[key] ?? [];
    acc[key].push(event);
    return acc;
  }, {});

  const orderedDateKeys = Object.keys(groupedEvents).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-[#0d0f12] p-6 text-zinc-200">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 rounded-xl border border-[#1e2229] bg-[#111318] p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Activity</p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-100">Recent Public Events</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {sortedEvents.length} {sortedEvents.length === 1 ? "event" : "events"} recorded
          </p>
        </header>

        {sortedEvents.length === 0 ? (
          <div className="rounded-xl border border-[#1e2229] bg-[#111318] p-8 text-center">
            <p className="text-lg font-semibold text-zinc-200">No recent activity found</p>
            <p className="mt-2 text-sm text-zinc-500">
              We could not find public events for this account right now.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orderedDateKeys.map((dateKey) => {
              const dayEvents = groupedEvents[dateKey];
              return (
                <section key={dateKey} className="rounded-xl border border-[#1e2229] bg-[#111318] p-5">
                  <h2 className="mb-4 text-base font-semibold text-amber-300">
                    {formatDateHeading(dayEvents[0].created_at)}
                  </h2>

                  <div className="space-y-4">
                    {dayEvents.map((event) => {
                      const icon = getEventIcon(event.type);
                      return (
                        <article
                          key={event.id}
                          className="rounded-lg border border-[#222832] bg-[#0a0c0f] p-4"
                        >
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