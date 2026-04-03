"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Folder,
  GitCommitHorizontal,
  LayoutDashboard,
  Flame,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type SidebarProps = {
  repos?: Array<{ name: string }>;
};

const overviewItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Activity", href: "/activity", icon: Activity },
  { label: "Commits", href: "/commits", icon: GitCommitHorizontal },
  { label: "Projects", href: "/projects", icon: Folder },
];

const statsItems: NavItem[] = [
  { label: "Languages", href: "/languages", icon: BarChart3 },
  { label: "Streak", href: "/streak", icon: Flame },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavSection({
  title,
  items,
  pathname,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <section>
      <h2 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
        {title}
      </h2>
      <ul className="space-y-1">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex items-center gap-2.5 border-l-2 px-3 py-2 text-sm transition-all duration-200",
                  active
                    ? "border-amber-400 bg-[#11151b] text-zinc-100"
                    : "border-transparent text-zinc-400 hover:translate-x-1 hover:bg-[#0f1318] hover:text-zinc-200",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function Sidebar({ repos = [] }: SidebarProps) {
  const pathname = usePathname() ?? "";
  const projectItems: NavItem[] = repos.map((repo) => ({
    label: repo.name,
    href: `/projects/${encodeURIComponent(repo.name)}`,
    icon: Folder,
  }));

  return (
    <aside
      className="flex h-screen w-[220px] shrink-0 flex-col border-r border-[#1e2229] bg-[#0a0c0f] text-zinc-200"
      style={{
        fontFamily:
          '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      }}
    >
      <div className="border-b border-[#1e2229] px-4 py-5">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold tracking-tight">devpulse</span>
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-amber-400" />
        </div>
      </div>

      <nav className="flex-1 space-y-7 px-2 py-6">
        <NavSection title="Overview" items={overviewItems} pathname={pathname} />
        {projectItems.length > 0 && (
          <NavSection title="Pinned Projects" items={projectItems} pathname={pathname} />
        )}
        <NavSection title="Stats" items={statsItems} pathname={pathname} />
      </nav>
    </aside>
  );
}

export default Sidebar;