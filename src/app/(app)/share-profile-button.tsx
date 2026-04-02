"use client";

import { useState } from "react";

export default function ShareProfileButton({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/u/${encodeURIComponent(username)}`;
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
      onClick={handleShare}
      className="rounded-lg border border-[#1e2229] bg-amber-400 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-amber-300"
    >
      {copied ? "Copied!" : "Share profile"}
    </button>
  );
}
