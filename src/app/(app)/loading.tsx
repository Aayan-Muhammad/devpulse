export default function AppLoading() {
  return (
    <div className="min-h-screen bg-[#0d0f12] p-6 text-zinc-200">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="dp-shimmer h-28 rounded-xl border border-[#1e2229] bg-[#111318]" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`stats-${index}`}
              className="dp-shimmer h-28 rounded-xl border border-[#1e2229] bg-[#111318]"
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`insight-${index}`}
              className="dp-shimmer h-32 rounded-xl border border-[#1e2229] bg-[#111318]"
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="dp-shimmer h-80 rounded-xl border border-[#1e2229] bg-[#111318]" />
          <div className="dp-shimmer h-80 rounded-xl border border-[#1e2229] bg-[#111318]" />
        </div>
      </div>
    </div>
  );
}