"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefreshDataButton() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 900);
  };

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={refreshing}
      className="inline-flex h-10 items-center justify-center rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-4 text-sm font-semibold text-zinc-200 transition-all duration-200 hover:border-amber-400 hover:text-amber-300 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {refreshing ? "Refreshing..." : "Refresh data"}
    </button>
  );
}