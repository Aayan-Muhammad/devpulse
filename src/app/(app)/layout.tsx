import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Topbar } from "@/components/layout/Topbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { getRepos } from "@/lib/github";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const username = session.user?.username;

  if (!username) {
    redirect("/login");
  }

  let repos: Array<{ name: string }> = [];

  try {
    const fetchedRepos = await getRepos(username, session.accessToken);
    repos = fetchedRepos.slice(0, 5).map((repo) => ({ name: repo.name }));
  } catch {
    repos = [];
  }

  return (
    <div className="flex min-h-screen flex-col bg-transparent text-zinc-200">
      <Topbar username={username} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar repos={repos} />
        <main className="dp-grid-bg min-h-0 flex-1 overflow-y-auto bg-transparent">{children}</main>
      </div>
    </div>
  );
}