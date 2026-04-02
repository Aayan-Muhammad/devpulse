"use client";

import { useState } from "react";

type CopyProfileUrlButtonProps = {
  value: string;
};

export function CopyProfileUrlButton({ value }: CopyProfileUrlButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-amber-400 hover:text-amber-300"
    >
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}