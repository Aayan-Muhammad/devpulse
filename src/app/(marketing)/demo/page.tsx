import Link from "next/link";
import { ArrowRight, CheckCircle2, GitCompareArrows, Sparkles, ShieldCheck } from "lucide-react";

const steps = [
  {
    title: "Open a public preview",
    description: "Start here to see what DevPulse shows before connecting any account.",
    icon: Sparkles,
  },
  {
    title: "Sign in with GitHub",
    description: "Use your own GitHub account to load your personal dashboard and data.",
    icon: ShieldCheck,
  },
  {
    title: "Compare and share",
    description: "Jump into public profiles or compare two accounts side by side.",
    icon: GitCompareArrows,
  },
];

const checklist = [
  "Public profile pages work without logging in.",
  "Your own dashboard appears after GitHub sign-in.",
  "Compare pages can be shared with anyone who has the link.",
  "Theme, accent, and layout settings persist for your session.",
];

const previewStats = [
  { label: "Repos", value: "42" },
  { label: "Followers", value: "128" },
  { label: "Stars", value: "3.4k" },
  { label: "Contributions", value: "1,284" },
];

const permissionNotes = [
  {
    title: "Who sees what",
    description: "Public profile routes are visible to everyone. Personal dashboards require your own sign-in.",
  },
  {
    title: "GitHub account ownership",
    description: "Every visitor signs in with their own GitHub account and sees their own personal data.",
  },
  {
    title: "OAuth setup",
    description: "Only one GitHub OAuth app is needed for this deployment. Visitors do not need to configure one.",
  },
];

export default function DemoPage() {
  return (
    <div className="dp-grid-bg min-h-screen bg-transparent px-6 py-10 text-zinc-200">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(255,255,255,0.03),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.08),transparent_26%)]" />
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col gap-8">
        <header className="dp-surface flex flex-col gap-4 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">Public onboarding</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">
              Start with the preview, then connect GitHub when you’re ready.
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="dp-control inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-[#0d0f12] hover:shadow-[0_4px_12px_rgba(251,191,36,0.3)]"
              style={{ backgroundColor: "var(--accent-color)" }}
            >
              Sign in with GitHub
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/u/torvalds"
              className="dp-control rounded-xl border border-[#2a2f37] bg-[#111318] px-5 py-3 text-sm font-semibold text-zinc-200 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
              style={{ borderColor: "var(--accent-color)" }}
            >
              Open sample profile
            </Link>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="dp-surface dp-reveal dp-card-lift rounded-3xl p-8">
            <div className="mb-6 inline-flex rounded-full border border-[#2a2f37] bg-[#0a0c0f] px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
              What this app does
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
              DevPulse turns raw GitHub activity into something easier to scan, compare, and share.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
              Use the public preview to understand the product first. When you sign in, the app pulls
              your own GitHub account and builds a personal dashboard from your repositories,
              languages, contributions, and activity.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {steps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <article
                    key={step.title}
                    className="dp-surface dp-control rounded-2xl p-5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#2a2f37]"
                      style={{ color: "var(--accent-color)", borderColor: "var(--accent-color)" }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-zinc-100">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{step.description}</p>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="dp-surface dp-reveal dp-card-lift rounded-3xl p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">Preview snapshot</p>
            <div className="mt-5 grid grid-cols-2 gap-4">
              {previewStats.map((stat) => (
                <div key={stat.label} className="dp-surface rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-widest text-zinc-500">{stat.label}</p>
                  <p className="mt-2 text-2xl font-bold text-zinc-100">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="dp-surface mt-6 rounded-2xl p-5">
              <p className="text-sm font-semibold text-zinc-100">What visitors can expect</p>
              <div className="mt-4 space-y-3">
                {checklist.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-zinc-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--accent-color)" }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/landing"
                className="dp-control rounded-xl border border-[#2a2f37] bg-[#0a0c0f] px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:shadow-[0_4px_12px_rgba(251,191,36,0.12)]"
                style={{ borderColor: "var(--accent-color)" }}
              >
                Back to landing
              </Link>
              <Link
                href="/compare/torvalds/gaearon"
                className="dp-control rounded-xl px-4 py-2.5 text-sm font-semibold text-[#0d0f12] hover:shadow-[0_4px_12px_rgba(251,191,36,0.3)]"
                style={{ backgroundColor: "var(--accent-color)" }}
              >
                Open compare example
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 pb-4 lg:grid-cols-2">
          <div className="dp-surface dp-reveal dp-card-lift rounded-3xl p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">Quick start checklist</p>
            <ol className="mt-5 space-y-4">
              <li className="rounded-2xl border border-[#1e2229] bg-[#0a0c0f] p-4">
                <p className="text-sm font-semibold text-zinc-100">1. Share the landing or demo link</p>
                <p className="mt-1 text-sm text-zinc-400">Visitors can learn the product flow before any sign-in prompt.</p>
              </li>
              <li className="rounded-2xl border border-[#1e2229] bg-[#0a0c0f] p-4">
                <p className="text-sm font-semibold text-zinc-100">2. Ask them to continue with GitHub</p>
                <p className="mt-1 text-sm text-zinc-400">The app uses the same deployment OAuth app and authenticates each person separately.</p>
              </li>
              <li className="rounded-2xl border border-[#1e2229] bg-[#0a0c0f] p-4">
                <p className="text-sm font-semibold text-zinc-100">3. Start from the dashboard quick actions</p>
                <p className="mt-1 text-sm text-zinc-400">Navigate to activity, projects, and language breakdown right away.</p>
              </li>
            </ol>
          </div>

          <div className="dp-surface dp-reveal dp-card-lift rounded-3xl p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">Permissions and trust</p>
            <div className="mt-5 space-y-4">
              {permissionNotes.map((note) => (
                <article key={note.title} className="rounded-2xl border border-[#1e2229] bg-[#0a0c0f] p-4">
                  <h3 className="text-sm font-semibold text-zinc-100">{note.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-zinc-400">{note.description}</p>
                </article>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="dp-control rounded-xl px-4 py-2.5 text-sm font-semibold text-[#0d0f12] hover:shadow-[0_4px_12px_rgba(251,191,36,0.3)]"
                style={{ backgroundColor: "var(--accent-color)" }}
              >
                Continue to sign in
              </Link>
              <Link
                href="/explore"
                className="dp-control rounded-xl border border-[#2a2f37] bg-[#0a0c0f] px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:shadow-[0_4px_12px_rgba(251,191,36,0.12)]"
                style={{ borderColor: "var(--accent-color)" }}
              >
                Go to Explore
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}