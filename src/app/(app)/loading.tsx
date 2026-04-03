export default function AppLoading() {
  return (
    <div className="dp-grid-bg min-h-screen bg-transparent p-6 text-zinc-200">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="dp-surface dp-shimmer h-28 rounded-xl" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`stats-${index}`}
              className="dp-surface dp-shimmer h-28 rounded-xl"
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`insight-${index}`}
              className="dp-surface dp-shimmer h-32 rounded-xl"
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="dp-surface dp-shimmer h-80 rounded-xl" />
          <div className="dp-surface dp-shimmer h-80 rounded-xl" />
        </div>
      </div>
    </div>
  );
}