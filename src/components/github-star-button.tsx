"use client";

import { useEffect, useState } from "react";
import { Github, Star } from "lucide-react";
import { GITHUB_REPO_URL } from "@/lib/github";
import { cn } from "@/lib/utils";

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

/** Современная кнопка-ссылка на репозиторий с живым счётчиком звёзд GitHub. */
export function GithubStarButton({ className }: { className?: string }) {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/github/stars")
      .then((r) => r.json())
      .then((d) => {
        if (mounted) setStars(typeof d?.stars === "number" ? d.stars : null);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <a
      href={GITHUB_REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Открыть репозиторий на GitHub"
      className={cn(
        "group inline-flex items-center overflow-hidden rounded-lg border border-border bg-white/[0.03] text-sm font-medium transition-all hover:border-primary/40 hover:bg-white/[0.06]",
        className,
      )}
    >
      <span className="inline-flex items-center gap-2 px-3 py-2">
        <Github className="h-4 w-4" />
        <span className="hidden sm:inline">GitHub</span>
        <span className="sm:hidden">Star</span>
      </span>
      <span className="inline-flex items-center gap-1 border-l border-border bg-white/[0.04] px-3 py-2 text-primary">
        <Star className="h-3.5 w-3.5 fill-current" />
        <span className="min-w-[1.5ch] text-center font-mono tabular-nums">
          {stars === null ? "—" : formatCount(stars)}
        </span>
      </span>
    </a>
  );
}
