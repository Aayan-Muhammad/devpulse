import { getUser, getRepos, getLanguageStats } from "@/lib/github";
import { auth } from "@/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user1 = searchParams.get("user1");
    const user2 = searchParams.get("user2");

    if (!user1 || !user2) {
      return Response.json(
        { error: "Both user1 and user2 parameters are required" },
        { status: 400 }
      );
    }

    if (user1.toLowerCase() === user2.toLowerCase()) {
      return Response.json(
        { error: "Cannot compare a user with themselves" },
        { status: 400 }
      );
    }

    const session = await auth();
    const accessToken = session?.accessToken;

    // Fetch data for both users in parallel
    const [userData1, userData2, reposData1, reposData2, langData1, langData2] = await Promise.all([
      getUser(user1, accessToken),
      getUser(user2, accessToken),
      getRepos(user1, accessToken),
      getRepos(user2, accessToken),
      getLanguageStats(user1, accessToken),
      getLanguageStats(user2, accessToken),
    ]);

    // Extract top languages for each user
    const lang1Entries = Object.entries(langData1)
      .map(([lang, bytes]) => ({ lang, bytes }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 10);

    const lang2Entries = Object.entries(langData2)
      .map(([lang, bytes]) => ({ lang, bytes }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 10);

    // Get all unique languages
    const allLanguages = new Set([
      ...lang1Entries.map((e) => e.lang),
      ...lang2Entries.map((e) => e.lang),
    ]);

    // Calculate language overlap
    const lang1Set = new Set(lang1Entries.map((e) => e.lang));
    const lang2Set = new Set(lang2Entries.map((e) => e.lang));
    const shared = Array.from(allLanguages).filter((lang) => lang1Set.has(lang) && lang2Set.has(lang));
    const only1 = Array.from(allLanguages).filter((lang) => lang1Set.has(lang) && !lang2Set.has(lang));
    const only2 = Array.from(allLanguages).filter((lang) => !lang1Set.has(lang) && lang2Set.has(lang));

    // Calculate stats
    const stars1 = reposData1.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const stars2 = reposData2.reduce((sum, repo) => sum + repo.stargazers_count, 0);

    const forks1 = reposData1.reduce((sum, repo) => sum + repo.forks_count, 0);
    const forks2 = reposData2.reduce((sum, repo) => sum + repo.forks_count, 0);

    // Activity estimate (count repos, recent activity indicator)
    const activePeriod = 90 * 24 * 60 * 60 * 1000; // 90 days
    const now = new Date();
    const active1 = reposData1.filter(
      (repo) => new Date(repo.updated_at).getTime() > now.getTime() - activePeriod
    ).length;
    const active2 = reposData2.filter(
      (repo) => new Date(repo.updated_at).getTime() > now.getTime() - activePeriod
    ).length;

    return Response.json({
      user1: {
        login: userData1.login,
        name: userData1.name,
        avatar_url: userData1.avatar_url,
        bio: userData1.bio,
        followers: userData1.followers,
        following: userData1.following,
        public_repos: userData1.public_repos,
        total_stars: stars1,
        total_forks: forks1,
        repos_updated_90d: active1,
        top_languages: lang1Entries,
      },
      user2: {
        login: userData2.login,
        name: userData2.name,
        avatar_url: userData2.avatar_url,
        bio: userData2.bio,
        followers: userData2.followers,
        following: userData2.following,
        public_repos: userData2.public_repos,
        total_stars: stars2,
        total_forks: forks2,
        repos_updated_90d: active2,
        top_languages: lang2Entries,
      },
      comparison: {
        shared_languages: shared,
        only_user1_languages: only1,
        only_user2_languages: only2,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("404")) {
      return Response.json(
        { error: "One or both users not found" },
        { status: 404 }
      );
    }

    return Response.json(
      { error: `Failed to fetch comparison data: ${message}` },
      { status: 500 }
    );
  }
}
