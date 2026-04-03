export type LanguageStats = Record<string, number>;

export interface GitHubSearchUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type: string;
  score: number;
  name?: string | null;
  bio?: string | null;
  followers?: number;
  public_repos?: number;
  totalStars?: number;
}

export interface GitHubUser {
  login: string;
  id: number;
  type: string;
  avatar_url: string;
  html_url: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  blog: string;
  location: string | null;
  email: string | null;
  twitter_username: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  fork: boolean;
  language: string | null;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

export interface GitHubEventRepo {
  id: number;
  name: string;
  url: string;
}

export interface GitHubEventActor {
  id: number;
  login: string;
  display_login?: string;
  avatar_url: string;
  url: string;
}

export interface GitHubEvent {
  id: string;
  type: string;
  actor: GitHubEventActor;
  repo: GitHubEventRepo;
  payload: Record<string, unknown>;
  public: boolean;
  created_at: string;
}

export interface ContributionDay {
  contributionCount: number;
  date: string;
  weekday: number;
}

export interface ContributionWeek {
  firstDay: string;
  contributionDays: ContributionDay[];
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}