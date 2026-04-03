"use server";

import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { LogIn } from "lucide-react";

export default async function LoginPage() {
  const session = await auth();

  if (session) {
    redirect("/");
  }

  async function handleSignIn() {
    "use server";
    await signIn("github", { redirectTo: "/" });
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0d0f12]">
      <div className="w-full max-w-md rounded-xl border border-[#1e2229] bg-[#111318] p-10">
        {/* Logo */}
        <div className="mb-2 flex items-center justify-center gap-2">
          <span className="font-mono text-2xl font-semibold" style={{ color: "var(--accent-color)" }}>
            devpulse
          </span>
          <span
            className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full"
            style={{ backgroundColor: "var(--accent-color)" }}
          />
        </div>

        {/* Tagline */}
        <p className="mb-8 text-center text-sm text-zinc-400">
          Your developer activity, beautifully visualized
        </p>

        {/* GitHub Sign In Button */}
        <form action={handleSignIn} className="mb-6">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-bold text-[#0d0f12] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(251,191,36,0.3)]"
            style={{ backgroundColor: "var(--accent-color)" }}
          >
            <LogIn className="h-5 w-5" />
            Continue with GitHub
          </button>
        </form>

        {/* Footer Text */}
        <p className="text-center text-xs text-zinc-500">
          Only public data is accessed unless you grant repo access
        </p>
      </div>
    </div>
  );
}