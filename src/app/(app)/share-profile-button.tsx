"use client";

import { useState } from "react";

export default function ShareProfileButton({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/u/${encodeURIComponent(username)}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${username}'s DevPulse profile`,
          text: "Check out this GitHub activity profile.",
          url: profileUrl,
        });
        setShared(true);
        setTimeout(() => setShared(false), 1800);
        return;
      } catch {
        // Fallback to clipboard copy when sharing is dismissed or unsupported.
      }
    }

    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="dp-control inline-flex h-10 items-center justify-center rounded-lg border border-[#1e2229] bg-amber-400 px-4 text-sm font-semibold text-black hover:bg-amber-300 hover:shadow-[0_4px_12px_rgba(251,191,36,0.3)]"
    >
      {shared ? "Shared!" : copied ? "Copied!" : "Share profile"}
    </button>
  );
}
