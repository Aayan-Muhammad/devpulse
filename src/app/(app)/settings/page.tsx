import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getRepos, getUser } from "@/lib/github";
import { CopyProfileUrlButton } from "./copy-profile-url-button";
import { DisplayPreferences } from "./display-preferences";
import { RefreshDataButton } from "./refresh-data-button";
import { SignOutButton } from "./sign-out-button";
import { AppearanceSection } from "./appearance-section";
import { ConnectionStatusPanel } from "./connection-status-panel";
import { PinnedReposPreferences } from "./pinned-repos-preferences";

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeWebsite(url: string): string | null {
  const value = url.trim();
  if (!value) {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

function SettingCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="dp-card-lift rounded-xl border border-[#1e2229] bg-[#0a0c0f] p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-1.5 break-words text-sm text-zinc-100">{value}</p>
    </div>
  );
}

export default async function SettingsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const username = session.user?.username;

  if (!username) {
    redirect("/login");
  }

  const [user, repos] = await Promise.all([
    getUser(username, session.accessToken),
    getRepos(username, session.accessToken),
  ]);
  const website = normalizeWebsite(user.blog);
  const twitterHandle = user.twitter_username ? `@${user.twitter_username}` : "Not set";
  const profileUrl = `/u/${encodeURIComponent(user.login)}`;
  const hasAccessToken = Boolean(session.accessToken);
  const syncedAt = new Date().toISOString();
  const repoOptions = repos
    .map((repo) => ({
      name: repo.name,
      htmlUrl: repo.html_url,
      stars: repo.stargazers_count,
    }))
    .sort((a, b) => b.stars - a.stars);

  return (
    <div className="min-h-screen bg-[#0d0f12] p-6 text-zinc-200">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="dp-reveal [animation-delay:40ms] rounded-xl border border-[#1e2229] bg-[#111318] p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Settings</p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-100">Account Preferences</h1>
          <p className="mt-1 text-sm text-zinc-400">Your GitHub profile details and DevPulse sharing options.</p>
        </header>

        <section className="dp-reveal [animation-delay:80ms] rounded-xl border border-[#1e2229] bg-[#111318] p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Profile</h2>
              <p className="text-sm text-zinc-400">Read-only profile data synced from GitHub.</p>
            </div>
            <a
              href="https://github.com/settings/profile"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[#2a2f37] bg-amber-400 px-4 text-sm font-semibold text-[#0d0f12] transition-all duration-200 hover:bg-amber-300 hover:shadow-[0_4px_12px_rgba(251,191,36,0.3)]"
            >
              Edit on GitHub
            </a>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr]">
            <div className="dp-card-lift rounded-xl border border-[#1e2229] bg-[#0a0c0f] p-5">
              <div className="flex items-center gap-4 lg:flex-col lg:items-start">
                <img
                  src={user.avatar_url}
                  alt={user.login}
                  width={88}
                  height={88}
                  className="h-22 w-22 rounded-full object-cover"
                />
                <div>
                  <p className="text-2xl font-semibold text-zinc-100">{user.name || user.login}</p>
                  <p className="text-sm text-zinc-400">@{user.login}</p>
                  {user.bio && <p className="mt-2 max-w-md text-sm text-zinc-300">{user.bio}</p>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <SettingCard label="Location" value={user.location || "Not set"} />
              <SettingCard label="Website" value={website ? website : "Not set"} />
              <SettingCard label="Twitter" value={twitterHandle} />
              <SettingCard label="Handle" value={`@${user.login}`} />
              <SettingCard label="Bio" value={user.bio || "No bio provided"} />
              <SettingCard label="Name" value={user.name || "Not set"} />
            </div>
          </div>
        </section>

        <section className="dp-reveal [animation-delay:120ms] rounded-xl border border-[#1e2229] bg-[#111318] p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Account</h2>
              <p className="text-sm text-zinc-400">GitHub account details and profile link.</p>
            </div>
            <a
              href={user.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-4 text-sm font-semibold text-zinc-200 transition-all duration-200 hover:border-amber-400 hover:text-amber-300 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
            >
              View on GitHub
            </a>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SettingCard label="Created" value={formatDate(user.created_at)} />
            <SettingCard label="Account Type" value={user.type || "User"} />
            <SettingCard label="Username" value={`@${user.login}`} />
          </div>
        </section>

        <section className="dp-reveal [animation-delay:160ms] rounded-xl border border-[#1e2229] bg-[#111318] p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-zinc-100">Share</h2>
            <p className="text-sm text-zinc-400">Share your public DevPulse profile with others.</p>
          </div>

          <div className="dp-card-lift flex flex-col gap-4 rounded-xl border border-[#1e2229] bg-[#0a0c0f] p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Public profile URL
              </p>
              <a
                href={profileUrl}
                className="mt-2 block break-all text-sm text-amber-300 transition-colors hover:text-amber-200"
              >
                {profileUrl}
              </a>
            </div>

            <div className="flex flex-wrap gap-3">
              <CopyProfileUrlButton value={profileUrl} />
              <Link
                href={profileUrl}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-[#2a2f37] bg-[#111318] px-4 text-sm font-semibold text-zinc-200 transition-all duration-200 hover:border-amber-400 hover:text-amber-300 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
              >
                Open profile
              </Link>
            </div>
          </div>
        </section>

        <AppearanceSection />

        <PinnedReposPreferences repos={repoOptions} initialPinned={[]} />

        <DisplayPreferences />

        <section className="dp-reveal [animation-delay:240ms] rounded-xl border border-[#1e2229] bg-[#111318] p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Diagnostics</h2>
              <p className="text-sm text-zinc-400">Connection and session diagnostics for this profile.</p>
            </div>
            <RefreshDataButton />
          </div>

          <ConnectionStatusPanel
            username={username}
            hasAccessToken={hasAccessToken}
            initialSyncedAt={syncedAt}
          />
        </section>

        <section className="dp-reveal [animation-delay:280ms] rounded-xl border border-red-500/20 bg-[#111318] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Danger Zone</h2>
              <p className="text-sm text-zinc-400">Sign out of DevPulse on this device.</p>
            </div>
            <SignOutButton />
          </div>
        </section>
      </div>
    </div>
  );
}