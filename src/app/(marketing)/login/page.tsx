"use server";

import Link from "next/link";
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
    <div className="dp-grid-bg flex min-h-screen w-full items-center justify-center bg-transparent p-6">
      <div className="dp-surface dp-card-lift dp-reveal w-full max-w-md rounded-3xl p-10">
        <div className="mb-2 flex items-center justify-center gap-2">
          <span className="font-mono text-2xl font-semibold" style={{ color: "var(--accent-color)" }}>
            devpulse
          </span>
          <span
            className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full"
            style={{ backgroundColor: "var(--accent-color)" }}
          />
        </div>

        <p className="mb-8 text-center text-sm text-zinc-400">
          Your developer activity, beautifully visualized
        </p>

        <form action={handleSignIn} className="mb-6">
          <button
            type="submit"
            className="dp-control dp-press flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-bold text-[#0d0f12] hover:shadow-[0_4px_12px_rgba(251,191,36,0.3)]"
            style={{ backgroundColor: "var(--accent-color)" }}
          >
            <LogIn className="h-5 w-5" />
            Continue with GitHub
          </button>
        </form>

        <div className="mb-6 text-center">
          <Link href="/demo" className="text-sm font-medium text-amber-300 transition-colors hover:text-amber-200">
            New here? See the preview first
          </Link>
        </div>

        <p className="text-center text-xs text-zinc-500">
          Uses your GitHub sign-in to load your own dashboard data
        </p>
      </div>
    </div>
  );
}