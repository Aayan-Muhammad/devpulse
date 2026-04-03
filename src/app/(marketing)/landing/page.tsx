import Link from "next/link";
import { BarChart3, Flame, Search } from "lucide-react";

const features = [
  {
    title: "Contribution Heatmap",
    description: "See your activity patterns across the year with a clean, high-signal heatmap.",
    icon: Flame,
  },
  {
    title: "Language Insights",
    description: "Understand the languages you use most, with proportional breakdowns across repos.",
    icon: BarChart3,
  },
  {
    title: "Explore Developers",
    description: "Search any GitHub user and jump into their public profile in seconds.",
    icon: Search,
  },
];

export default function LandingPage() {
  return (
    <div className="dp-grid-bg relative min-h-screen overflow-hidden bg-transparent text-zinc-200">
      <div className="dp-hero-glow -left-24 top-16 h-72 w-72 rounded-full" style={{ backgroundColor: "var(--accent-color)" }} />
      <div
        className="dp-hero-glow dp-orb--slow -right-32 top-48 h-96 w-96 rounded-full"
        style={{ backgroundColor: "color-mix(in oklab, var(--accent-color), #06b6d4 35%)" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.03),transparent_35%)] opacity-80" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,12,15,0)_0%,rgba(10,12,15,0.42)_100%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-5">
        <header className="dp-surface dp-reveal flex items-center justify-between rounded-2xl px-5 py-4">
          <Link
            href="/landing"
            className="font-mono text-lg font-semibold tracking-tight transition-colors"
            style={{ color: "var(--accent-color)" }}
          >
            devpulse
          </Link>

          <Link
            href="/login"
            className="dp-control rounded-lg border border-[#2a2f37] px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-amber-400 hover:text-amber-300 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
            style={{ borderColor: "var(--accent-color)" }}
          >
            Sign in with GitHub
          </Link>
        </header>

        <main className="flex flex-1 flex-col justify-center py-12">
          <section className="dp-reveal dp-reveal-delay-1 mx-auto max-w-4xl text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">
              GitHub activity analytics
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-100 sm:text-6xl lg:text-7xl">
              Your GitHub activity, beautifully visualized
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
              DevPulse turns your repositories, contributions, languages, and public activity into a
              focused dashboard built for developers who want clarity instead of noise.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/login"
                className="dp-control rounded-xl px-6 py-3 text-sm font-semibold text-[#0d0f12] hover:shadow-[0_4px_12px_rgba(251,191,36,0.3)]"
                style={{ backgroundColor: "var(--accent-color)" }}
              >
                Get started
              </Link>
              <Link
                href="/demo"
                className="dp-control rounded-xl border border-[#2a2f37] px-6 py-3 text-sm font-semibold text-zinc-200 hover:border-amber-400 hover:text-amber-300 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
                style={{ borderColor: "var(--accent-color)" }}
              >
                Open preview
              </Link>
              <Link
                href="/u/torvalds"
                className="dp-control rounded-xl border border-[#2a2f37] px-6 py-3 text-sm font-semibold text-zinc-200 hover:border-amber-400 hover:text-amber-300 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
                style={{ borderColor: "var(--accent-color)" }}
              >
                View a sample profile
              </Link>
            </div>
          </section>

          <section className="mt-20 grid grid-cols-1 gap-4 md:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="dp-surface dp-reveal dp-card-lift rounded-2xl p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
                  style={{ animationDelay: `${180 + index * 80}ms` }}
                >
                  <div
                    className="dp-surface mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl shadow-[0_0_30px_color-mix(in_oklab,var(--accent-color),transparent_70%)]"
                    style={{ color: "var(--accent-color)", borderColor: "var(--accent-color)" }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-zinc-100">{feature.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{feature.description}</p>
                </article>
              );
            })}
          </section>
        </main>

        <footer className="dp-reveal dp-reveal-delay-3 flex flex-col gap-2 border-t border-[#1e2229]/80 py-5 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono" style={{ color: "var(--accent-color)" }}>devpulse</span>
          <p>Built to make GitHub activity easier to understand at a glance.</p>
        </footer>
      </div>
    </div>
  );
}