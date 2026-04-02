import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRepos, getUser } from "@/lib/github";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim();

  if (!username) {
    return NextResponse.json({ error: "Missing username query parameter." }, { status: 400 });
  }

  const session = await auth();
  const accessToken = session?.accessToken;

  try {
    const [user, repos] = await Promise.all([
      getUser(username, accessToken),
      getRepos(username, accessToken),
    ]);

    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);

    return NextResponse.json({ user, repos, totalStars });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const notFound = message.includes(" 404 ") || message.includes("404 Not Found");

    return NextResponse.json(
      {
        error: notFound
          ? `Could not find a GitHub user named @${username}.`
          : "Could not load that profile right now. Please try again in a moment.",
      },
      { status: notFound ? 404 : 500 }
    );
  }
}
