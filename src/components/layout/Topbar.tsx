"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type NavItem = {
  label: string;
  href: string;
};

type TopbarProps = {
  username: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Repos", href: "/repos" },
  { label: "Projects", href: "/projects" },
  { label: "Explore", href: "/explore" },
  { label: "Settings", href: "/settings" },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(username: string): string {
  const normalized = username.trim().replace(/^@+/, "");
  const parts = normalized
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean);

  if (parts.length === 0) {
    return "??";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function Topbar({ username }: TopbarProps) {
  const pathname = usePathname() ?? "";
  const initials = getInitials(username);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <nav
      className="flex items-center justify-between w-full h-[57px] px-6 bg-[#0a0c0f] border-b border-[#1e2229] text-zinc-200"
      style={{
        fontFamily:
          '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold tracking-tight text-amber-400">devpulse</span>
        <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-amber-400" />
      </div>

      <div className="flex items-center gap-2" aria-label="Primary navigation">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "px-3 py-1.5 text-sm transition-colors",
                active ? "text-amber-400" : "text-zinc-400 hover:text-zinc-200",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-md border border-[#2a2f37] px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-amber-400 hover:text-amber-300"
        >
          Sign out
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1e2229] bg-zinc-800 text-xs font-semibold text-zinc-200">
          {initials}
        </div>
      </div>
    </nav>
  );
}

export default Topbar;
