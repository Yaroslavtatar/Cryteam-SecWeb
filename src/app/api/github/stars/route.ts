import { NextResponse } from "next/server";
import { GITHUB_REPO, GITHUB_REPO_URL } from "@/lib/github";

export const runtime = "nodejs";
// Кешируем результат на час, чтобы не упираться в лимиты GitHub API.
export const revalidate = 3600;

export async function GET() {
  let stars: number | null = null;
  let forks: number | null = null;
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = (await res.json()) as {
        stargazers_count?: number;
        forks_count?: number;
      };
      if (typeof data.stargazers_count === "number") stars = data.stargazers_count;
      if (typeof data.forks_count === "number") forks = data.forks_count;
    }
  } catch {
    // Сеть недоступна — вернём null, кнопка покажется без счётчика.
  }

  return NextResponse.json(
    { stars, forks, url: GITHUB_REPO_URL, repo: GITHUB_REPO },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
