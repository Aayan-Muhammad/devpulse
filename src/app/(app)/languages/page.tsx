import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getLanguageStats } from "@/lib/github";

type LanguageEntry = {
  name: string;
  bytes: number;
  percentage: number;
};

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
  "#ef4444",
  "#14b8a6",
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const decimals = value >= 100 ? 0 : 1;
  return `${value.toFixed(decimals)} ${units[unitIndex]}`;
}

function getLanguageColor(language: string): string {
  let hash = 0;

  for (let i = 0; i < language.length; i += 1) {
    hash = (hash * 31 + language.charCodeAt(i)) >>> 0;
  }

  return LANGUAGE_COLORS[hash % LANGUAGE_COLORS.length];
}

export default async function LanguagesPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const username = session.user?.username;

  if (!username) {
    redirect("/login");
  }

  const languageStats = await getLanguageStats(username, session.accessToken);

  const totalBytes = Object.values(languageStats).reduce((sum, bytes) => sum + bytes, 0);

  const entries: LanguageEntry[] = Object.entries(languageStats)
    .map(([name, bytes]) => ({
      name,
      bytes,
      percentage: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0,
    }))
    .sort((a, b) => b.bytes - a.bytes);

  const topLanguage = entries[0] ?? null;

  return (
    <div className="min-h-screen bg-[#0d0f12] p-6 text-zinc-200">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-xl border border-[#1e2229] bg-[#111318] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Language Insights
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-zinc-100">Repository Language Breakdown</h1>
              <p className="mt-1 text-sm text-zinc-400">
                {entries.length} {entries.length === 1 ? "language" : "languages"} detected
              </p>
            </div>

            {topLanguage ? (
              <div className="rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-5 py-4 text-right">
                <p className="text-xs uppercase tracking-widest text-zinc-500">Top Language</p>
                <p className="mt-1 text-2xl font-bold text-amber-300">{topLanguage.name}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {topLanguage.percentage.toFixed(1)}% • {formatBytes(topLanguage.bytes)}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="rounded-xl border border-[#1e2229] bg-[#111318] p-8 text-center">
            <p className="text-lg font-semibold text-zinc-200">No language data available</p>
            <p className="mt-2 text-sm text-zinc-500">
              We could not calculate language stats for this account right now.
            </p>
          </div>
        ) : (
          <>
            <section className="mb-6 rounded-xl border border-[#1e2229] bg-[#111318] p-6">
              <h2 className="mb-4 text-lg font-semibold text-zinc-100">Usage Distribution</h2>
              <div className="h-6 w-full overflow-hidden rounded-md bg-[#0a0c0f] ring-1 ring-[#1e2229]">
                <div className="flex h-full w-full">
                  {entries.map((language) => (
                    <div
                      key={language.name}
                      className="h-full"
                      style={{
                        width: `${language.percentage}%`,
                        backgroundColor: getLanguageColor(language.name),
                      }}
                      title={`${language.name}: ${language.percentage.toFixed(1)}%`}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {entries.map((language) => (
                  <div
                    key={`${language.name}-legend`}
                    className="inline-flex items-center gap-2 rounded-full border border-[#2a2f37] bg-[#0a0c0f] px-3 py-1 text-xs text-zinc-300"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: getLanguageColor(language.name) }}
                    />
                    <span>
                      {language.name} ({language.percentage.toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {entries.map((language) => (
                <article
                  key={language.name}
                  className="rounded-xl border border-[#1e2229] bg-[#111318] p-5"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: getLanguageColor(language.name) }}
                      />
                      <h3 className="text-lg font-semibold text-zinc-100">{language.name}</h3>
                    </div>
                    <p className="text-sm font-medium text-amber-300">
                      {language.percentage.toFixed(1)}%
                    </p>
                  </div>

                  <p className="mb-3 text-sm text-zinc-400">{formatBytes(language.bytes)} total</p>

                  <div className="h-2.5 w-full rounded bg-[#0a0c0f]">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${language.percentage}%`,
                        backgroundColor: getLanguageColor(language.name),
                      }}
                    />
                  </div>
                </article>
              ))}
            </section>
          </>
        )}
      </div>
    </div>
  );
}