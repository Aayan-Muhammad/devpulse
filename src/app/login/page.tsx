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
          <span className="font-mono text-2xl font-semibold text-amber-400">
            devpulse
          </span>
          <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-amber-400" />
        </div>

        {/* Tagline */}
        <p className="mb-8 text-center text-sm text-zinc-400">
          Your developer activity, beautifully visualized
        </p>

        {/* GitHub Sign In Button */}
        <form action={handleSignIn} className="mb-6">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-3 font-bold text-[#0d0f12] transition-colors hover:bg-amber-300"
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
