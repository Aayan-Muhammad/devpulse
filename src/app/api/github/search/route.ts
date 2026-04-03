import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PER_PAGE = 15;
const ENRICH_LIMIT = 6;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();
  const page = Number(searchParams.get("page") ?? "1");
  const sort = searchParams.get("sort")?.trim() ?? "best";
  const type = searchParams.get("type")?.trim() ?? "all";
  const minFollowers = Number(searchParams.get("minFollowers") ?? "0");

  if (!query) {
    return NextResponse.json({ error: "Missing query parameter." }, { status: 400 });
  }

  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeMinFollowers = Number.isFinite(minFollowers) && minFollowers > 0
    ? Math.floor(minFollowers)
    : 0;

  const qualifiers: string[] = [];

  if (type === "user" || type === "org") {
    qualifiers.push(`type:${type}`);
  }

  if (safeMinFollowers > 0) {
    qualifiers.push(`followers:>=${safeMinFollowers}`);
  }

  const fullQuery = [query, ...qualifiers].join(" ").trim();

  const sortParams =
    sort === "followers"
      ? "&sort=followers&order=desc"
      : sort === "repositories"
        ? "&sort=repositories&order=desc"
        : "";

  const session = await auth();
  const accessToken = session?.accessToken;

  const headers = new Headers({ Accept: "application/vnd.github+json" });

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(
    `https://api.github.com/search/users?q=${encodeURIComponent(fullQuery)}&per_page=${PER_PAGE}&page=${safePage}${sortParams}`,
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

  const remainingHeader = response.headers.get("x-ratelimit-remaining");
  const resetHeader = response.headers.get("x-ratelimit-reset");
  const rateLimitRemaining = remainingHeader ? Number(remainingHeader) : null;
  const rateLimitResetAt = resetHeader ? Number(resetHeader) : null;

  const shouldEnrich = rateLimitRemaining === null || rateLimitRemaining > ENRICH_LIMIT * 2;

  const detailedItems = await Promise.all(
    payload.items.map(async (item, index) => {
      if (!shouldEnrich || index >= ENRICH_LIMIT) {
        return item;
      }

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

  const isPartial = !shouldEnrich || payload.items.length > ENRICH_LIMIT;

  return NextResponse.json({
    query,
    page: safePage,
    perPage: PER_PAGE,
    totalCount: payload.total_count,
    items: detailedItems,
    enrichment: {
      isPartial,
      enrichedCount: shouldEnrich ? Math.min(payload.items.length, ENRICH_LIMIT) : 0,
      totalItems: payload.items.length,
      rateLimitRemaining,
      rateLimitResetAt,
    },
    filters: {
      sort,
      type,
      minFollowers: safeMinFollowers,
    },
  });
}