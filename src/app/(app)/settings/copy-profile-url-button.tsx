"use client";

import { toast } from "sonner";

type CopyProfileUrlButtonProps = {
  value: string;
};

export function CopyProfileUrlButton({ value }: CopyProfileUrlButtonProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Profile URL copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-lg border border-[#2a2f37] bg-[#0a0c0f] px-4 py-2 text-sm font-semibold text-zinc-200 transition-all duration-200 hover:border-amber-400 hover:text-amber-300 hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)]"
    >
      Copy link
    </button>
  );
}