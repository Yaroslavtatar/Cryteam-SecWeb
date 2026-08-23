// Конфигурация и помощники для интеграции с GitHub-репозиторием.

/** Репозиторий в формате "owner/name". Переопределяется через окружение. */
export const GITHUB_REPO =
  process.env.NEXT_PUBLIC_GITHUB_REPO || "Yaroslavtatar/Cryteam-SecWeb";

export const GITHUB_REPO_URL = `https://github.com/${GITHUB_REPO}`;

/** Разбирает "owner/name" или полный URL GitHub в {owner, name}. */
export function parseRepo(input: string): { owner: string; name: string } | null {
  const cleaned = input
    .trim()
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/\.git$/i, "")
    .replace(/\/$/, "");
  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  return { owner: parts[0], name: parts[1] };
}

export interface NewIssueOptions {
  title?: string;
  body?: string;
  labels?: string[];
  template?: string;
}

/** Строит URL страницы создания issue на GitHub с предзаполненными полями. */
export function newIssueUrl(opts: NewIssueOptions = {}): string {
  const params = new URLSearchParams();
  if (opts.title) params.set("title", opts.title);
  if (opts.body) params.set("body", opts.body);
  if (opts.labels && opts.labels.length) params.set("labels", opts.labels.join(","));
  if (opts.template) params.set("template", opts.template);
  const qs = params.toString();
  return `${GITHUB_REPO_URL}/issues/new${qs ? `?${qs}` : ""}`;
}

/** Ссылки на разделы репозитория. */
export const GITHUB_LINKS = {
  repo: GITHUB_REPO_URL,
  issues: `${GITHUB_REPO_URL}/issues`,
  newIssue: `${GITHUB_REPO_URL}/issues/new`,
  stargazers: `${GITHUB_REPO_URL}/stargazers`,
  fork: `${GITHUB_REPO_URL}/fork`,
};
