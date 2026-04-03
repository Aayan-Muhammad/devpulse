import type {
  ContributionCalendar,
  GitHubEvent,
  GitHubRepo,
  GitHubUser,
  LanguageStats,
} from "@/types/github";

const GITHUB_API_BASE_URL = "https://api.github.com";
const REVALIDATE_SECONDS = 3600;
const PER_PAGE = 100;

export type GitHubProfileSnapshot = {
  login: string;
  name: string | null;
  followers: number;
  totalStars: number;
  topLanguage: string;
  isFallback: boolean;
};

type FetchOptions = RequestInit & {
  next?: {
    revalidate: number;
  };
};

async function fetchFromGitHub<T>(
  path: string,
  init?: FetchOptions,
  accessToken?: string
): Promise<T> {
  const headers = new Headers(init?.headers);

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${GITHUB_API_BASE_URL}${path}`, {
    ...init,
    headers,
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

async function fetchGitHubGraphQL<T>(
  query: string,
  variables: Record<string, unknown>,
  accessToken?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${GITHUB_API_BASE_URL}/graphql`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  if (!payload.data) {
    throw new Error("GitHub GraphQL response did not include data.");
  }

  return payload.data;
}

export async function getUser(username: string, accessToken?: string): Promise<GitHubUser> {
  try {
    return await fetchFromGitHub<GitHubUser>(
      `/users/${encodeURIComponent(username)}`,
      undefined,
      accessToken
    );
  } catch (error) {
    throw new Error(
      `Unable to load GitHub user profile for "${username}".${
        error instanceof Error ? ` ${error.message}` : ""
      }`
    );
  }
}

export async function getRepos(username: string, accessToken?: string): Promise<GitHubRepo[]> {
  try {
    return await fetchFromGitHub<GitHubRepo[]>(
      `/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=${PER_PAGE}`,
      undefined,
      accessToken
    );
  } catch {
    return [];
  }
}

export async function getEvents(username: string, accessToken?: string): Promise<GitHubEvent[]> {
  try {
    return await fetchFromGitHub<GitHubEvent[]>(
      `/users/${encodeURIComponent(username)}/events/public?per_page=${PER_PAGE}`,
      undefined,
      accessToken
    );
  } catch {
    return [];
  }
}

async function getAllRepos(username: string, accessToken?: string): Promise<GitHubRepo[]> {
  const allRepos: GitHubRepo[] = [];

  for (let page = 1; ; page += 1) {
    const repos = await fetchFromGitHub<GitHubRepo[]>(
      `/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=${PER_PAGE}&page=${page}`,
      undefined,
      accessToken
    );

    allRepos.push(...repos);

    if (repos.length < PER_PAGE) {
      break;
    }
  }

  return allRepos;
}

export async function getLanguageStats(
  username: string,
  accessToken?: string
): Promise<LanguageStats> {
  try {
    const repos = await getAllRepos(username, accessToken);

    if (!repos.length) {
      return {} as LanguageStats;
    }

    const languageResponses = await Promise.all(
      repos.map(async (repo) => {
        try {
          return await fetchFromGitHub<Record<string, number>>(
            `/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo.name)}/languages`,
            undefined,
            accessToken
          );
        } catch {
          return {};
        }
      })
    );

    const totals: Record<string, number> = {};

    for (const languageMap of languageResponses) {
      for (const [language, bytes] of Object.entries(languageMap)) {
        totals[language] = (totals[language] ?? 0) + bytes;
      }
    }

    return totals as LanguageStats;
  } catch {
    return {} as LanguageStats;
  }
}

export async function getContributionCalendar(
  username: string,
  accessToken?: string
): Promise<ContributionCalendar> {
  const fallback: ContributionCalendar = {
    totalContributions: 0,
    weeks: [],
  };

  try {
    const query = `
      query UserContributionCalendar($username: String!) {
        user(login: $username) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                firstDay
                contributionDays {
                  contributionCount
                  date
                  weekday
                }
              }
            }
          }
        }
      }
    `;

    type GraphQLResult = {
      user: {
        contributionsCollection: {
          contributionCalendar: ContributionCalendar;
        };
      } | null;
    };

    const data = await fetchGitHubGraphQL<GraphQLResult>(query, { username }, accessToken);
    return data.user?.contributionsCollection.contributionCalendar ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getProfileSnapshot(
  username: string,
  accessToken?: string
): Promise<GitHubProfileSnapshot> {
  try {
    const [user, repos] = await Promise.all([
      getUser(username, accessToken),
      getRepos(username, accessToken),
    ]);

    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);

    const languageCounts = repos.reduce<Record<string, number>>((acc, repo) => {
      if (repo.language) {
        acc[repo.language] = (acc[repo.language] ?? 0) + 1;
      }
      return acc;
    }, {});

    const topLanguageEntry = Object.entries(languageCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      login: user.login,
      name: user.name,
      followers: user.followers,
      totalStars,
      topLanguage: topLanguageEntry?.[0] ?? "N/A",
      isFallback: false,
    };
  } catch {
    return {
      login: username,
      name: null,
      followers: 0,
      totalStars: 0,
      topLanguage: "N/A",
      isFallback: true,
    };
  }
}