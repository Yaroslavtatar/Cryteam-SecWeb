import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Lightbulb, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { CyberBackground } from "@/components/background";
import { FadeIn } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { blogArticles, getBlogArticle } from "@/lib/blog";

export function generateStaticParams() {
  return blogArticles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = getBlogArticle(params.slug);
  if (!article) return { title: "Статья не найдена" };
  return {
    title: `${article.title} — CRYTEAM SecWeb`,
    description: article.summary,
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = getBlogArticle(params.slug);
  if (!article) notFound();

  const user = await getCurrentUser();

  return (
    <>
      <CyberBackground />
      <AppHeader user={user} />
      <article className="container max-w-3xl py-8 md:py-12">
        <FadeIn>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Все рекомендации
          </Link>
        </FadeIn>

        <FadeIn className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="data">{article.category}</Badge>
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            {article.title}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">{article.summary}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(article.publishedAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {article.readMin} мин чтения
            </span>
          </div>
        </FadeIn>

        <FadeIn className="mt-8 space-y-5">
          {article.content.map((paragraph, i) => (
            <p key={i} className="text-base leading-relaxed text-foreground/90">
              {paragraph}
            </p>
          ))}
        </FadeIn>

        <FadeIn className="mt-10">
          <div className="glass rounded-xl border-[hsl(var(--defense))]/30 p-6">
            <div className="mb-4 flex items-center gap-2 font-semibold text-[hsl(var(--defense))]">
              <Lightbulb className="h-5 w-5" />
              Краткий чек-лист
            </div>
            <ul className="space-y-3">
              {article.tips.map((tip, i) => (
                <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[hsl(var(--defense))]/15 text-xs font-medium text-[hsl(var(--defense))]">
                    {i + 1}
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </FadeIn>

        <FadeIn className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href={user ? "/constructor" : "/register"}
            className={buttonVariants({ size: "lg" })}
          >
            <ShieldCheck className="h-4 w-4" />
            {user ? "Разобрать в конструкторе" : "Начать курсы профилактики"}
          </Link>
          <Link
            href="/blog"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            Другие рекомендации
          </Link>
        </FadeIn>
      </article>
    </>
  );
}
