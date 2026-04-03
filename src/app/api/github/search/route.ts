import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PER_PAGE = 15;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();
  const page = Number(searchParams.get("page") ?? "1");

  if (!query) {
    return NextResponse.json({ error: "Missing query parameter." }, { status: 400 });
  }

  const session = await auth();
  const accessToken = session?.accessToken;

  const headers = new Headers({ Accept: "application/vnd.github+json" });

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(
    `https://api.github.com/search/users?q=${encodeURIComponent(query)}&per_page=${PER_PAGE}&page=${page}`,
    { headers }
  );

  if (!response.ok) {
    const status = response.status;
    return NextResponse.json(
      {
        error:
          status === 404
            ? `Could not find any GitHub users matching "${query}".`
            : "Could not search GitHub users right now. Please try again in a moment.",
      },
      { status }
    );
  }

  const payload = (await response.json()) as {
    total_count: number;
    items: Array<{
      login: string;
      id: number;
      avatar_url: string;
      html_url: string;
      type: string;
      score: number;
    }>;
  };

  const detailedItems = await Promise.all(
    payload.items.map(async (item) => {
      try {
        const [userResponse, reposResponse] = await Promise.all([
          fetch(`https://api.github.com/users/${encodeURIComponent(item.login)}`, { headers }),
          fetch(
            `https://api.github.com/users/${encodeURIComponent(item.login)}/repos?per_page=100`,
            { headers }
          ),
        ]);

        if (!userResponse.ok || !reposResponse.ok) {
          return item;
        }

        const user = (await userResponse.json()) as {
          name: string | null;
          bio: string | null;
          followers: number;
          public_repos: number;
        };

        const repos = (await reposResponse.json()) as Array<{ stargazers_count: number }>;
        const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count ?? 0), 0);

        return {
          ...item,
          name: user.name,
          bio: user.bio,
          followers: user.followers,
          public_repos: user.public_repos,
          totalStars,
        };
      } catch {
        return item;
      }
    })
  );

  return NextResponse.json({
    query,
    page,
    perPage: PER_PAGE,
    totalCount: payload.total_count,
    items: detailedItems,
  });
}