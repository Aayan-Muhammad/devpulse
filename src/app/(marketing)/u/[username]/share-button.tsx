"use client";

import { toast } from "sonner";

export function ShareButton({ username }: { username: string }) {
  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/u/${encodeURIComponent(username)}`;

    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success("Profile link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link. Try again.");
    }
  };

  return (
    <button
      onClick={handleShare}
      className="rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-4 py-2 text-sm font-semibold text-zinc-200 transition-all duration-200 hover:border-amber-400 hover:text-amber-300 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
    >
      Share
    </button>
  );
}
