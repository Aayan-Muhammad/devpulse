import { auth } from "@/auth";
import { getContributionCalendar } from "@/lib/github";
import { redirect } from "next/navigation";

type CalendarDay = {
  date: string;
  count: number;
};

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1);
}

function getIntensityClass(count: number, maxCount: number): string {
  if (count <= 0) return "bg-[#1a1f26]";

  const ratio = count / Math.max(maxCount, 1);

  if (ratio < 0.25) return "bg-[#6b3b16]";
  if (ratio < 0.5) return "bg-[#9a4d15]";
  if (ratio < 0.75) return "bg-[#cf6a17]";
  return "bg-[#f0a030]";
}

function buildDayMap(calendarDays: CalendarDay[]): Map<string, number> {
  const map = new Map<string, number>();

  for (const day of calendarDays) {
    map.set(day.date, day.count);
  }

  return map;
}

function calculateCurrentStreak(dayMap: Map<string, number>): number {
  const today = new Date();
  let streak = 0;

  for (let offset = 0; ; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = toDateKey(date);
    const count = dayMap.get(key) ?? 0;

    if (count < 1) {
      break;
    }

    streak += 1;
  }

  return streak;
}

function calculateLongestStreak(calendarDays: CalendarDay[]): number {
  let longest = 0;
  let current = 0;
  let previousDate: Date | null = null;

  for (const day of calendarDays) {
    const date = new Date(day.date);
    const hasContribution = day.count > 0;
    const isConsecutive = previousDate
      ? date.getTime() - previousDate.getTime() === 24 * 60 * 60 * 1000
      : true;

    if (hasContribution && isConsecutive) {
      current += 1;
    } else if (hasContribution) {
      current = 1;
    } else {
      current = 0;
    }

    if (hasContribution) {
      longest = Math.max(longest, current);
    }

    previousDate = date;
  }

  return longest;
}

export default async function StreakPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const username = session.user?.username;

  if (!username) {
    redirect("/login");
  }

  const contributionCalendar = await getContributionCalendar(username, session.accessToken);
  const calendarDays = contributionCalendar.weeks.flatMap((week) =>
    week.contributionDays.map((day) => ({
      date: day.date,
      count: day.contributionCount,
    }))
  );

  const dayMap = buildDayMap(calendarDays);
  const currentStreak = calculateCurrentStreak(dayMap);
  const longestStreak = calculateLongestStreak(calendarDays);

  const currentYear = new Date().getFullYear();
  const totalContributionsThisYear = calendarDays.reduce((sum, day) => {
    return new Date(day.date).getFullYear() === currentYear ? sum + day.count : sum;
  }, 0);

  const last30Days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));

    const key = toDateKey(date);

    return {
      date: key,
      label: formatDayLabel(date),
      count: dayMap.get(key) ?? 0,
    };
  });

  const maxLast30Count = last30Days.reduce((max, day) => Math.max(max, day.count), 0);

  return (
    <div className="min-h-screen bg-[#0d0f12] p-6 text-zinc-200">
      <div className="mx-auto max-w-6xl">
        <div className="dp-reveal [animation-delay:40ms] mb-6 rounded-xl border border-[#1e2229] bg-[#111318] p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Streak</p>
          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-6xl font-bold tracking-tight text-amber-300 sm:text-7xl">
              {currentStreak}
            </p>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-400">
              day streak
            </p>
          </div>
          <p className="mt-3 text-sm text-zinc-500">
            Consecutive contribution days up to today.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="dp-reveal dp-card-lift [animation-delay:80ms] rounded-xl border border-[#1e2229] bg-[#111318] p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Longest Streak
            </p>
            <p className="mt-2 text-3xl font-bold text-zinc-100">
              {longestStreak} {longestStreak === 1 ? "day" : "days"}
            </p>
            <p className="mt-1 text-sm text-zinc-400">Best consecutive run in the calendar</p>
          </div>

          <div className="dp-reveal dp-card-lift [animation-delay:110ms] rounded-xl border border-[#1e2229] bg-[#111318] p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Contributions This Year
            </p>
            <p className="mt-2 text-3xl font-bold text-zinc-100">
              {totalContributionsThisYear.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-zinc-400">Total contributions recorded in {currentYear}</p>
          </div>
        </div>

        <div className="dp-reveal dp-card-lift [animation-delay:150ms] rounded-xl border border-[#1e2229] bg-[#111318] p-6">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Last 30 Days</h2>
              <p className="text-sm text-zinc-400">Daily contribution volume</p>
            </div>
            <p className="text-sm font-semibold text-amber-400">
              {last30Days.reduce((sum, day) => sum + day.count, 0)} contributions
            </p>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="min-w-max">
              <div className="flex items-end gap-2">
                {last30Days.map((day) => {
                  const height = day.count === 0 ? 8 : Math.min(140, 16 + day.count * 12);
                  return (
                    <div key={day.date} className="flex w-5 flex-col items-center gap-2">
                      <div
                        title={`${day.count} contributions on ${day.date}`}
                        className={`w-5 rounded-t-md ${getIntensityClass(day.count, maxLast30Count)}`}
                        style={{ height: `${height}px` }}
                      />
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                        {day.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}