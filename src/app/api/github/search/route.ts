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

  return NextResponse.json({
    query,
    page,
    perPage: PER_PAGE,
    totalCount: payload.total_count,
    items: payload.items,
  });
}